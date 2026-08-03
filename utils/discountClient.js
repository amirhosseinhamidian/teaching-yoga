'use client';

import { reportClientError } from '@/utils/reportClientError';

export class DiscountClientError extends Error {
  constructor(message, { status = 0, code = 'DISCOUNT_REQUEST_FAILED' } = {}) {
    super(message);

    this.name = 'DiscountClientError';

    this.status = status;

    this.code = code;
  }
}

const parseResponse = async (response) => {
  return response.json().catch(() => null);
};

const handleFailure = ({ response, data, operation }) => {
  const error = new DiscountClientError(
    data?.message || 'عملیات کد تخفیف ناموفق بود.',
    {
      status: response.status,

      code:
        operation === 'reserve'
          ? 'DISCOUNT_RESERVATION_FAILED'
          : 'DISCOUNT_REFRESH_FAILED',
    }
  );

  /*
   * خطاهای اعتبارسنجی 4xx به‌عنوان خطای سیستم
   * Report نمی‌شوند.
   */
  if (response.status >= 500) {
    reportClientError(error, {
      event:
        operation === 'reserve'
          ? 'discount_reservation_api_failed'
          : 'discount_refresh_api_failed',

      component: 'discountClient',

      data: {
        status: response.status,

        operation,
      },
    });
  }

  throw error;
};

export const reserveDiscount = async (code) => {
  const response = await fetch('/api/apply-discount-code', {
    method: 'POST',

    credentials: 'include',

    cache: 'no-store',

    headers: {
      'Content-Type': 'application/json',

      Accept: 'application/json',
    },

    body: JSON.stringify({
      code,
    }),
  }).catch((error) => {
    reportClientError(error, {
      event: 'discount_reservation_network_failed',

      component: 'discountClient',

      data: {
        operation: 'reserve',
      },
    });

    throw new DiscountClientError('ارتباط با سرور کد تخفیف برقرار نشد.');
  });

  const data = await parseResponse(response);

  if (!response.ok || !data?.success) {
    handleFailure({
      response,
      data,
      operation: 'reserve',
    });
  }

  return data;
};

export const refreshDiscountReservation = async () => {
  const response = await fetch('/api/apply-discount-code', {
    method: 'PATCH',

    credentials: 'include',

    cache: 'no-store',

    headers: {
      Accept: 'application/json',
    },
  }).catch((error) => {
    reportClientError(error, {
      event: 'discount_refresh_network_failed',

      component: 'discountClient',

      data: {
        operation: 'refresh',
      },
    });

    throw new DiscountClientError('ارتباط با سرور کد تخفیف برقرار نشد.');
  });

  const data = await parseResponse(response);

  if (!response.ok || !data?.success) {
    handleFailure({
      response,
      data,
      operation: 'refresh',
    });
  }

  return data;
};
