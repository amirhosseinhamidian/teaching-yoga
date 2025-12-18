// app/api/subscription/checkout/route.js
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'شناسه پلن ارسال نشده است.' },
        { status: 400 }
      );
    }

    const plan = await prismadb.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'پلن اشتراک یافت نشد یا غیرفعال است.' },
        { status: 404 }
      );
    }

    // محاسبه مبلغ نهایی (تومان)
    const basePrice = plan.price || 0;
    const discount = plan.discountAmount || 0;
    const finalAmountToman = Math.max(basePrice - discount, 0);

    if (finalAmountToman <= 0) {
      return NextResponse.json(
        { error: 'مبلغ نهایی اشتراک معتبر نیست.' },
        { status: 400 }
      );
    }

    // مبلغ برای زرین‌پال (ریال)
    const amountRial = finalAmountToman * 10;

    // ساخت سبد برای نظم دیتابیس (کاربر UI سبد را نمی‌بیند)
    const cart = await prismadb.cart.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        totalPrice: finalAmountToman, // تومان
        totalDiscount: discount, // تومان
        cartSubscriptions: {
          create: {
            subscriptionPlanId: plan.id,
            price: basePrice, // تومان
            discount: discount, // تومان
          },
        },
      },
    });

    // ساخت رکورد پرداخت (amount = ریال، برای هماهنگی با verify فعلی)
    const payment = await prismadb.payment.create({
      data: {
        userId: user.id,
        cartId: cart.id,
        amount: amountRial, // ریال
        status: 'PENDING',
        method: 'ONLINE',
      },
    });

    // متغیرهای زرین‌پال از env
    const apiBaseUrl = process.env.ZARINPAL_API_BASE_URL; // مثل: https://payment.zarinpal.com/pg/v4/payment
    const merchantId = process.env.ZARINPAL_PAYMENT_MERCHANT_ID;
    const callbackUrlBase = process.env.ZARINPAL_PAYMENT_CALLBACK_URL; // مثل: https://samaneyoga.ir/api/checkout/verify
    const startPayBaseUrl = process.env.ZARINPAL_PAYMENT_BASE_URL; // مثل: https://payment.zarinpal.com/pg/StartPay/

    if (!apiBaseUrl || !merchantId || !callbackUrlBase || !startPayBaseUrl) {
      console.error(
        '[ZARINPAL_CONFIG_ERROR] یکی از متغیرهای محیطی زرین‌پال تنظیم نشده است.'
      );
      return NextResponse.json(
        { error: 'خطای تنظیمات درگاه پرداخت.' },
        { status: 500 }
      );
    }

    // نوع پرداخت را در کوئری می‌فرستیم (subscription) برای استفاده در verify
    const callbackUrl = `${callbackUrlBase}?paymentId=${payment.id}&type=subscription`;

    const requestBody = {
      merchant_id: merchantId,
      amount: amountRial,
      description: `خرید اشتراک: ${plan.name}`,
      callback_url: callbackUrl,
      metadata: {
        email: user.email || undefined,
        mobile: user.phone || undefined,
      },
    };

    const requestUrl = `${apiBaseUrl}/request.json`;

    const zarinpalRes = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const zarinpalData = await zarinpalRes.json();
    const zData = zarinpalData?.data;

    if (!zarinpalRes.ok || !zData || zData.code !== 100) {
      console.error('[ZARINPAL_REQUEST_ERROR]', zarinpalData);
      return NextResponse.json(
        {
          error: 'خطا در اتصال به درگاه پرداخت.',
          gatewayError: zarinpalData,
        },
        { status: 500 }
      );
    }

    const authority = zData.authority;

    await prismadb.payment.update({
      where: { id: payment.id },
      data: { authority },
    });

    // لینک مستقیم شروع پرداخت زرین‌پال
    const redirectUrl = `${startPayBaseUrl}${authority}`;

    return NextResponse.json(
      {
        redirectUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SUBSCRIPTION_CHECKOUT_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
