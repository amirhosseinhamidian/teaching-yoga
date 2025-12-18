/* eslint-disable no-undef */
export async function createPayment({ amountInRial, mobile, description }) {
  const res = await fetch(`${process.env.ZARINPAL_API_BASE_URL}/request.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_PAYMENT_MERCHANT_ID,
      amount: Number(amountInRial),
      description,
      callback_url: process.env.ZARINPAL_PAYMENT_CALLBACK_URL,
      metadata: { mobile },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!data?.data?.authority) {
    console.error('Zarinpal Error:', data?.errors);
    throw new Error(data?.errors?.message || 'خطا در ایجاد تراکنش');
  }

  const authority = data.data.authority;

  return {
    authority,
    paymentUrl: `${process.env.ZARINPAL_PAYMENT_BASE_URL}${authority}`,
  };
}

export async function verifyPayment({ amountInRial, authority }) {
  const res = await fetch(`${process.env.ZARINPAL_API_BASE_URL}/verify.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_PAYMENT_MERCHANT_ID,
      amount: Number(amountInRial),
      authority,
    }),
  });

  const data = await res.json().catch(() => ({}));
  return data;
}
