/* eslint-disable no-undef */

const createPayment = async ({ amountInRial, mobile, description }) => {
  try {
    const response = await fetch(
      `${process.env.ZARINPAL_API_BASE_URL}/request.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: process.env.ZARINPAL_PAYMENT_MERCHANT_ID,
          amount: amountInRial,
          description,
          callback_url: process.env.ZARINPAL_PAYMENT_CALLBACK_URL,
          metadata: {
            mobile,
          },
        }),
      }
    );

    const data = await response.json();

    // ❌ زرین پال خطا داده → authority وجود ندارد
    if (!data.data || !data.data.authority) {
      console.error('Zarinpal Error:', data.errors);
      throw new Error(data.errors?.message || 'خطا در ایجاد تراکنش');
    }

    const authority = data.data.authority;

    return {
      authority,
      paymentUrl: `${process.env.ZARINPAL_PAYMENT_BASE_URL}${authority}`,
    };
  } catch (error) {
    console.error('create payment error =>', error);
    throw error; // ❗ مهم: جلوی undefined را می‌گیرد
  }
};

module.exports = {
  createPayment,
};
