import {
  createZarinpalPayment,
  verifyZarinpalPayment,
} from '@/server/payment/zarinpal-client';

/*
 * Wrapper سازگاری برای Importهای قدیمی.
 * تماس واقعی با درگاه فقط در zarinpal-client انجام می‌شود.
 */
export async function createPayment({ amountInRial, description }) {
  const result = await createZarinpalPayment({
    amountInRial,
    description,
  });

  return {
    authority: result.authority,

    paymentUrl: result.redirectUrl,
  };
}

export async function verifyPayment({ amountInRial, authority }) {
  const result = await verifyZarinpalPayment({
    amountInRial,
    authority,
  });

  /*
   * شکل قدیمی پاسخ برای سازگاری موقت.
   * Route جدید مستقیماً Client اصلی را استفاده می‌کند.
   */
  return {
    data: {
      code: result.gatewayCode,

      ref_id: result.referenceId,
    },
  };
}
