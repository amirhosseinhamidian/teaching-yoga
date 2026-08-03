'use server';

import { createZarinpalPayment } from '@/server/payment/zarinpal-client';

/*
 * Wrapper سازگاری موقت.
 * Routeهای جدید باید مستقیماً از server/payment استفاده کنند.
 */
export const createPayment = async ({ amountInRial, description }) => {
  const result = await createZarinpalPayment({
    amountInRial,
    description,
  });

  return {
    authority: result.authority,
    paymentUrl: result.redirectUrl,
  };
};
