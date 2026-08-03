/* eslint-disable no-undef */
import 'server-only';

const DEFAULT_TIMEOUT_MS = 10000;

export class OtpDeliveryError extends Error {
  constructor(
    message = 'OTP delivery failed.',
    { providerStatus = null, cause = null } = {}
  ) {
    super(message, {
      cause,
    });

    this.name = 'OtpDeliveryError';
    this.providerStatus = providerStatus;
  }
}

const getConfiguration = () => {
  const apiKey = String(process.env.KAVENEGAR_API_KEY || '').trim();

  const template = String(
    process.env.KAVENEGAR_TEMPLATE || 'samanehyoga'
  ).trim();

  if (!apiKey) {
    throw new OtpDeliveryError('Kavenegar API key is not configured.');
  }

  if (!template) {
    throw new OtpDeliveryError('Kavenegar template is not configured.');
  }

  return {
    apiKey,
    template,
  };
};

export const sendOtpWithKavenegar = async ({ phone, code }) => {
  const { apiKey, template } = getConfiguration();

  const endpoint = new URL(
    `https://api.kavenegar.com/v1/${encodeURIComponent(
      apiKey
    )}/verify/lookup.json`
  );

  endpoint.searchParams.set('receptor', phone);

  endpoint.searchParams.set('token', code);

  endpoint.searchParams.set('template', template);

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    const responseData = await response.json().catch(() => null);

    const providerStatus = Number(responseData?.return?.status) || null;

    if (!response.ok || providerStatus !== 200) {
      throw new OtpDeliveryError('Kavenegar rejected the OTP request.', {
        providerStatus,
      });
    }

    return {
      providerStatus,
    };
  } catch (error) {
    if (error instanceof OtpDeliveryError) {
      throw error;
    }

    throw new OtpDeliveryError('Kavenegar OTP request failed.', {
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
};
