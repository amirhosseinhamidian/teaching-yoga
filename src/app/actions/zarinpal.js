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
      },
    );
    const data = response.data.data;
    return {
      paymentUrl: process.env.ZARINPAL_PAYMENT_BASE_URL + data.authority,
      authority: data.authority,
    };
  } catch (error) {
    console.error('create payment error =>', error);
  }
};

const verifyPayment = async ({ amountInRial, authority }) => {
  try {
    const response = await fetch(
      `${process.env.ZARINPAL_API_BASE_URL}/verify.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant_id: process.env.ZARINPAL_PAYMENT_MERCHANT_ID,
          amount: amountInRial,
          authority,
        }),
      },
    );
    return response.data;
  } catch (error) {
    return error.response?.data || error;
  }
};

module.exports = {
  createPayment,
  verifyPayment,
};
