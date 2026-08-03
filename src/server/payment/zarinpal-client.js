import 'server-only';

const DEFAULT_TIMEOUT_MS = 12000;

export class PaymentGatewayError extends Error {
  constructor(
    message,
    {
      code = 'PAYMENT_GATEWAY_ERROR',
      operation = 'unknown',
      gatewayCode = null,
      httpStatus = null,
      retryable = false,
      cause = null,
    } = {}
  ) {
    super(message, {
      cause,
    });

    this.name = 'PaymentGatewayError';
    this.code = code;
    this.operation = operation;
    this.gatewayCode = gatewayCode;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
  }
}

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

const getRequiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new PaymentGatewayError(`${name} is not configured.`, {
      code: 'PAYMENT_GATEWAY_CONFIGURATION_ERROR',
      operation: 'configuration',
    });
  }

  return value;
};

const normalizeBaseUrl = (value) => {
  return value.replace(/\/+$/, '');
};

const getConfiguration = () => {
  const apiBaseUrl = normalizeBaseUrl(
    getRequiredEnvironmentValue('ZARINPAL_API_BASE_URL')
  );

  const paymentBaseUrl = normalizeBaseUrl(
    getRequiredEnvironmentValue('ZARINPAL_PAYMENT_BASE_URL')
  );

  const callbackUrl = getRequiredEnvironmentValue(
    'ZARINPAL_PAYMENT_CALLBACK_URL'
  );

  const merchantId = getRequiredEnvironmentValue(
    'ZARINPAL_PAYMENT_MERCHANT_ID'
  );

  const timeoutMs = getPositiveInteger(
    process.env.PAYMENT_GATEWAY_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS
  );

  for (const configuredUrl of [apiBaseUrl, paymentBaseUrl, callbackUrl]) {
    let parsedUrl;

    try {
      parsedUrl = new URL(configuredUrl);
    } catch {
      throw new PaymentGatewayError(
        'Payment gateway URL configuration is invalid.',
        {
          code: 'PAYMENT_GATEWAY_CONFIGURATION_ERROR',
          operation: 'configuration',
        }
      );
    }

    if (
      process.env.NODE_ENV === 'production' &&
      parsedUrl.protocol !== 'https:'
    ) {
      throw new PaymentGatewayError(
        'Payment gateway URLs must use HTTPS in production.',
        {
          code: 'PAYMENT_GATEWAY_CONFIGURATION_ERROR',
          operation: 'configuration',
        }
      );
    }
  }

  return {
    apiBaseUrl,
    paymentBaseUrl,
    callbackUrl,
    merchantId,
    timeoutMs,
  };
};

const normalizeAmountInRial = (value) => {
  const amount = Number(value);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new PaymentGatewayError(
      'Payment amount must be a positive integer in rial.',
      {
        code: 'INVALID_PAYMENT_AMOUNT',
        operation: 'validation',
      }
    );
  }

  return amount;
};

const normalizeDescription = (value) => {
  const description = String(value || '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200);

  return description || 'پرداخت سمانه یوگا';
};

const getGatewayCode = (payload) => {
  const candidates = [
    payload?.data?.code,
    payload?.errors?.code,
    Array.isArray(payload?.errors) ? payload.errors[0]?.code : null,
  ];

  for (const candidate of candidates) {
    const number = Number(candidate);

    if (Number.isFinite(number)) {
      return Math.trunc(number);
    }
  }

  return null;
};

const requestGateway = async ({ operation, endpoint, body, timeoutMs }) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(body),

      cache: 'no-store',
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    return {
      response,
      payload,
      gatewayCode: getGatewayCode(payload),
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new PaymentGatewayError('Payment gateway request timed out.', {
        code: 'PAYMENT_GATEWAY_TIMEOUT',
        operation,
        retryable: true,
        cause: error,
      });
    }

    throw new PaymentGatewayError('Payment gateway request failed.', {
      code: 'PAYMENT_GATEWAY_NETWORK_ERROR',
      operation,
      retryable: true,
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeAuthority = (value) => {
  const authority = typeof value === 'string' ? value.trim() : '';

  if (
    authority.length < 10 ||
    authority.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(authority)
  ) {
    throw new PaymentGatewayError(
      'Payment gateway returned an invalid authority.',
      {
        code: 'PAYMENT_GATEWAY_INVALID_AUTHORITY',
        operation: 'request',
      }
    );
  }

  return authority;
};

export const buildZarinpalRedirectUrl = (authorityValue) => {
  const { paymentBaseUrl } = getConfiguration();

  const authority = normalizeAuthority(authorityValue);

  return `${paymentBaseUrl}/${encodeURIComponent(authority)}`;
};

export const createZarinpalPayment = async ({ amountInRial, description }) => {
  const { apiBaseUrl, callbackUrl, merchantId, timeoutMs } = getConfiguration();

  const amount = normalizeAmountInRial(amountInRial);

  const result = await requestGateway({
    operation: 'request',

    endpoint: `${apiBaseUrl}/request.json`,

    timeoutMs,

    body: {
      merchant_id: merchantId,
      amount,

      description: normalizeDescription(description),

      callback_url: callbackUrl,

      /*
       * شماره موبایل و ایمیل عمداً ارسال نمی‌شوند.
       * این Metadata برای ایجاد تراکنش الزامی نیست.
       */
      metadata: {},
    },
  });

  const authorityValue = result.payload?.data?.authority;

  if (!result.response.ok || result.gatewayCode !== 100 || !authorityValue) {
    throw new PaymentGatewayError(
      'Payment gateway rejected the transaction request.',
      {
        code: 'PAYMENT_GATEWAY_REQUEST_REJECTED',
        operation: 'request',
        gatewayCode: result.gatewayCode,
        httpStatus: result.response.status,
        retryable: result.response.status >= 500,
      }
    );
  }

  const authority = normalizeAuthority(authorityValue);

  return {
    authority,
    redirectUrl: buildZarinpalRedirectUrl(authority),
    gatewayCode: result.gatewayCode,
  };
};

export const verifyZarinpalPayment = async ({
  amountInRial,
  authority: authorityValue,
}) => {
  const { apiBaseUrl, merchantId, timeoutMs } = getConfiguration();

  const amount = normalizeAmountInRial(amountInRial);

  const authority = normalizeAuthority(authorityValue);

  const result = await requestGateway({
    operation: 'verify',

    endpoint: `${apiBaseUrl}/verify.json`,

    timeoutMs,

    body: {
      merchant_id: merchantId,
      amount,
      authority,
    },
  });

  if (!result.response.ok || ![100, 101].includes(result.gatewayCode)) {
    throw new PaymentGatewayError('Payment gateway verification failed.', {
      code: 'PAYMENT_GATEWAY_VERIFY_REJECTED',
      operation: 'verify',
      gatewayCode: result.gatewayCode,
      httpStatus: result.response.status,
      retryable: result.response.status >= 500,
    });
  }

  const rawReferenceId = result.payload?.data?.ref_id;

  const referenceId =
    rawReferenceId === null || rawReferenceId === undefined
      ? null
      : String(rawReferenceId).trim();

  return {
    success: true,
    gatewayCode: result.gatewayCode,
    referenceId: referenceId || null,
  };
};
