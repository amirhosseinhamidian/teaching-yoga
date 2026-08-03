/* eslint-disable no-undef */
// src/app/api/checkout/route.js

import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';
import {
  initializeOnlinePayment,
  PaymentInitializationError,
} from '@/server/payment/initialize-online-payment';
import { PaymentGatewayError } from '@/server/payment/zarinpal-client';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';
import { withApiLogging } from '@/server/logger/with-api-logging';
import { DiscountReservationError } from '@/server/discount/discount-reservation';

/**
 * helpers
 */
function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toTomanWithVat13(amountToman) {
  return Math.ceil(Math.max(0, Number(amountToman || 0)) * 1.13);
}

function normalizeFa(s) {
  return String(s || '')
    .trim()
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ');
}

function buildDefaultDesc({ hasCourses, hasShop }) {
  if (hasCourses && hasShop) return 'پرداخت دوره + خرید محصول';
  if (hasShop) return 'خرید محصول';
  if (hasCourses) return 'پرداخت دوره';
  return 'پرداخت';
}

/**
 * گرفتن quote از API خودت و تبدیل options
 * ✅ مبلغ را با 1.13 اعمال می‌کنیم
 */
function normalizeOptionsFromApi(json) {
  const options = Array.isArray(json?.options) ? json.options : [];
  return options.map((o) => ({
    key: String(o.key),
    title: String(o.title || ''),
    amount: toTomanWithVat13(Number(o.amount || 0)), // ✅ VAT/markup 13%
    etaText: o.etaText ? String(o.etaText) : '—',
    logoUrl: o.logoUrl ? String(o.logoUrl) : null,
    meta: o.meta ?? null,
  }));
}

/**
 * سرور: تایید هزینه ارسال انتخاب‌شده (POST) با صدا زدن quote
 */
async function resolveShippingCostFromQuote({ req, addressId, postOptionKey }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const cookie = req.headers.get('cookie') || '';

  const res = await fetch(`${base}/api/shop/shipping/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    cache: 'no-store',
    body: JSON.stringify({ addressId }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || 'خطا در استعلام هزینه ارسال';
    const err = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  const options = normalizeOptionsFromApi(json);

  const selected =
    options.find((o) => String(o.key) === String(postOptionKey)) || null;

  if (postOptionKey && !selected) {
    const err = new Error('روش ارسال انتخاب‌شده معتبر نیست یا تغییر کرده است.');
    err.status = 400;
    err.data = { optionsKeys: options.map((x) => x.key) };
    throw err;
  }

  const picked = selected || options[0] || null;

  return {
    quoteRaw: json,
    options,
    picked,
    shippingCost: toInt(picked?.amount || 0, 0), // تومان (already *1.13)
  };
}

/**
 * ✅ محاسبه نهایی سبد دوره‌ها دقیقاً مطابق buildCartResponse
 * - ترم‌ها را با termSet یکبار حساب می‌کند
 * - تخفیف ترم درصدی است (term.discount)
 * - دوره‌های خریداری‌شده (UserCourse ACTIVE) را لحاظ نمی‌کند
 * - discountCodeAmount از cart کم می‌شود
 */
function computeCoursePayableLikeBuildCartResponse({
  cart,
  purchasedCourseIds,
}) {
  if (!cart) return { totalPayable: 0, totalPrice: 0, discountAmount: 0 };

  const cartTerms = Array.isArray(cart.cartTerms) ? cart.cartTerms : [];
  const cartCourses = Array.isArray(cart.cartCourses) ? cart.cartCourses : [];

  const coursesMap = new Map();

  // termSet مثل همون کد
  const termSet = new Set(cartTerms.map((ct) => ct.term?.id).filter(Boolean));

  cartCourses.forEach((cartCourse) => {
    const course = cartCourse.course;
    if (!course?.id) return;

    if (!coursesMap.has(course.id)) {
      coursesMap.set(course.id, {
        courseId: course.id,
        finalPrice: 0,
        discount: 0,
        finalPriceWithoutDiscount: 0,
      });
    }

    cartTerms.forEach((ct) => {
      const term = ct.term;
      if (!term?.id) return;

      const courseTerms = Array.isArray(term.courseTerms)
        ? term.courseTerms
        : [];

      // همان منطق isPurchased
      const isPurchased = courseTerms.some((ct2) =>
        purchasedCourseIds.has(ct2?.course?.id)
      );

      const isThisCourseInTerm = courseTerms.some(
        (ct2) => ct2?.course?.id === course.id
      );

      if (termSet.has(term.id) && !isPurchased && isThisCourseInTerm) {
        const price = Math.max(0, toInt(term.price, 0));
        const percent = Math.max(0, Number(term.discount || 0));
        const dis = (price * percent) / 100;
        const final = price - dis;

        const info = coursesMap.get(course.id);
        info.finalPrice += final;
        info.discount += dis;
        info.finalPriceWithoutDiscount += price;

        // خیلی مهم: حذف از termSet تا دوباره حساب نشود
        termSet.delete(term.id);
      }
    });
  });

  const coursesInfo = Array.from(coursesMap.values());

  const totalPrice = coursesInfo.reduce((s, c) => s + (c.finalPrice || 0), 0);
  const discountAmount = Math.max(0, toInt(cart.discountCodeAmount, 0));

  const totalPayable = Math.max(0, Math.trunc(totalPrice - discountAmount));

  return {
    totalPayable,
    totalPrice,
    discountAmount,
  };
}

const handlePost = async (req) => {
  let log = getRequestLogger({
    component: 'checkout',
  });

  let userId = null;
  try {
    const body = await req.json().catch(() => ({}));

    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'لطفا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    userId = user.id;

    log = log.child({
      userId,
    });

    const cartId = body?.cartId != null ? Number(body.cartId) : null;
    const shopCartId =
      body?.shopCartId != null ? Number(body.shopCartId) : null;

    const hasCoursesInput = Number.isInteger(cartId) && cartId > 0;
    const hasShopInput = Number.isInteger(shopCartId) && shopCartId > 0;

    if (!hasCoursesInput && !hasShopInput) {
      return NextResponse.json(
        { error: 'هیچ سبد خریدی برای پرداخت ارسال نشده است.' },
        { status: 400 }
      );
    }

    const dbUser = await prismadb.user.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    if (!dbUser.phone) {
      return NextResponse.json(
        { error: 'شماره موبایل خود را ثبت کنید.' },
        { status: 400 }
      );
    }

    // ----------------------------
    // 1) Load carts (+ purchased)
    // ----------------------------
    const [purchased, courseCart, shopCart] = await Promise.all([
      hasCoursesInput
        ? prismadb.userCourse.findMany({
            where: { userId, status: 'ACTIVE' },
            select: { courseId: true },
          })
        : Promise.resolve([]),

      hasCoursesInput
        ? prismadb.cart.findFirst({
            where: { id: cartId, userId, status: 'PENDING' },
            include: {
              cartTerms: {
                include: {
                  term: {
                    include: {
                      courseTerms: {
                        include: { course: true },
                      },
                    },
                  },
                },
              },
              cartCourses: {
                include: { course: true },
              },
            },
          })
        : Promise.resolve(null),

      hasShopInput
        ? prismadb.shopCart.findFirst({
            where: {
              id: shopCartId,
              userId,
              status: 'PENDING',
              isActive: true,
            },
            include: {
              items: {
                select: {
                  id: true,
                  productId: true,
                  qty: true,
                  unitPrice: true,
                  colorId: true,
                  sizeId: true,
                  product: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      coverImage: true,
                      isActive: true,
                      stock: true,
                      price: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (hasCoursesInput && !courseCart) {
      return NextResponse.json(
        { error: 'سبد خرید دوره نامعتبر است.' },
        { status: 400 }
      );
    }

    const shopItems = Array.isArray(shopCart?.items) ? shopCart.items : [];
    if (hasShopInput && (!shopCart || shopItems.length === 0)) {
      return NextResponse.json(
        { error: 'سبد خرید محصولات خالی یا نامعتبر است.' },
        { status: 400 }
      );
    }

    const purchasedIds = new Set((purchased || []).map((c) => c.courseId));

    // ----------------------------
    // 2) Compute totals (Server truth)
    // ----------------------------
    const courseCalc = hasCoursesInput
      ? computeCoursePayableLikeBuildCartResponse({
          cart: courseCart,
          purchasedCourseIds: purchasedIds,
        })
      : { totalPayable: 0 };

    const coursePayable = Math.max(0, toInt(courseCalc.totalPayable, 0));

    const shopSubtotal = hasShopInput
      ? shopItems.reduce((sum, it) => {
          const qty = Math.max(1, toInt(it.qty, 1));
          const unit = Math.max(0, toInt(it.unitPrice, 0));
          return sum + unit * qty;
        }, 0)
      : 0;

    const shopDiscountAmount = hasShopInput
      ? Math.max(0, toInt(shopCart?.discountCodeAmount || 0, 0))
      : 0;

    const shopPayable = hasShopInput
      ? Math.max(0, shopSubtotal - shopDiscountAmount)
      : 0;

    // ----------------------------
    // 3) Shipping (server verification)
    // ----------------------------
    const shippingInput = body?.shipping || null;
    const addressId = hasShopInput
      ? Number(body?.addressId || shippingInput?.addressId || 0)
      : 0;

    let shippingMethod = 'POST'; // POST | COURIER
    let postOptionKey = null;
    let shippingCost = 0; // تومان (with 1.13)
    let shippingTitle = '';
    let shippingMeta = null;

    let deliveryDate = null;
    let deliverySlot = null;

    let address = null;

    if (hasShopInput) {
      if (!addressId || Number.isNaN(addressId)) {
        return NextResponse.json(
          { error: 'برای خرید محصول، انتخاب آدرس الزامی است.' },
          { status: 400 }
        );
      }

      address = await prismadb.userAddress.findFirst({
        where: { id: addressId, userId },
      });

      if (!address) {
        return NextResponse.json({ error: 'آدرس یافت نشد.' }, { status: 404 });
      }

      const shippingMethodInput = String(
        shippingInput?.method || 'POST'
      ).toUpperCase();

      shippingMethod =
        shippingMethodInput === 'COURIER_COD' ? 'COURIER_COD' : 'POST';

      postOptionKey =
        shippingMethod === 'POST' && shippingInput?.postOptionKey
          ? String(shippingInput.postOptionKey).trim()
          : null;

      deliveryDate = shippingInput?.deliveryDate
        ? new Date(shippingInput.deliveryDate)
        : null;

      deliverySlot = shippingInput?.deliverySlot
        ? String(shippingInput.deliverySlot).trim()
        : null;

      if (shippingMethod === 'POST') {
        if (!postOptionKey) {
          return NextResponse.json(
            { error: 'لطفاً سرویس ارسال با پست را انتخاب کنید.' },
            { status: 400 }
          );
        }

        const resolved = await resolveShippingCostFromQuote({
          req,
          addressId,
          postOptionKey,
        });

        shippingCost = toInt(resolved.shippingCost, 0);
        shippingTitle = String(resolved?.picked?.title || '').trim() || 'پست';

        shippingMeta = {
          addressId,

          service: {
            key: String(resolved?.picked?.key || postOptionKey || ''),
            title: String(resolved?.picked?.title || shippingTitle || ''),
            etaText: resolved?.picked?.etaText
              ? String(resolved.picked.etaText)
              : null,
          },
        };
      } else {
        // COURIER
        shippingCost = 0; // در محل پرداخت می‌شود
        shippingTitle = 'پیک تهران';
        shippingMeta = {
          addressId,
          payAtDestination: true,
        };
      }
    }

    // ----------------------------
    // 4) Online payable (Server truth)
    // ----------------------------
    const onlinePayable = Math.max(
      0,
      coursePayable + shopPayable + (hasShopInput ? shippingCost : 0)
    );

    if (onlinePayable <= 0) {
      return NextResponse.json(
        { error: 'مبلغ قابل پرداخت صفر است. سبد خرید را بررسی کنید.' },
        { status: 400 }
      );
    }

    // sanity-check (فقط لاگ)
    const clientAmount = toInt(body?.amount, -1);
    if (clientAmount >= 0 && Math.abs(clientAmount - onlinePayable) > 5000) {
      log.warn(
        {
          event: 'checkout_client_amount_mismatch',

          cartId,
          shopCartId,

          hasCourses: hasCoursesInput,
          hasShop: hasShopInput,
        },
        'Client checkout amount did not match server calculation'
      );
    }

    // ----------------------------
    // 5) Create/Update ShopOrder (if hasShop)
    // ----------------------------
    let shopOrder = null;

    if (hasShopInput) {
      // موجودی و فعال بودن محصول
      for (const it of shopItems) {
        const qty = Math.max(1, toInt(it.qty, 1));

        if (!it.product?.isActive) {
          return NextResponse.json(
            { error: `محصول "${it.product?.title || 'نامشخص'}" غیرفعال است.` },
            { status: 400 }
          );
        }

        const stock = toInt(it.product?.stock, 0);
        if (stock < qty) {
          return NextResponse.json(
            {
              error: `موجودی محصول "${it.product?.title || 'نامشخص'}" کافی نیست.`,
            },
            { status: 400 }
          );
        }
      }

      const fullName =
        normalizeFa(address?.fullName) ||
        normalizeFa(`${dbUser?.firstname || ''} ${dbUser?.lastname || ''}`);

      if (!fullName) {
        return NextResponse.json(
          { error: 'نام و نام خانوادگی برای ثبت سفارش الزامی است.' },
          { status: 400 }
        );
      }

      const orderItemsData = shopItems.map((it) => ({
        productId: it.productId,
        qty: Math.max(1, toInt(it.qty, 1)),
        unitPrice: Math.max(0, toInt(it.unitPrice, 0)),
        title: String(it.product?.title || 'محصول').trim(),
        colorId: it.colorId ?? null,
        sizeId: it.sizeId ?? null,
        coverImage: it.product?.coverImage
          ? String(it.product.coverImage)
          : null,
        slug: it.product?.slug ? String(it.product.slug) : null,
      }));

      const notesParts = [];
      if (postOptionKey) notesParts.push(`postOptionKey=${postOptionKey}`);
      if (shippingTitle) notesParts.push(`shippingTitle=${shippingTitle}`);
      const notes = notesParts.length ? notesParts.join(' | ') : null;

      const existingOrder = await prismadb.shopOrder.findFirst({
        where: {
          userId,
          shopCartId: shopCart.id,
        },

        orderBy: {
          id: 'desc',
        },
      });

      const orderData = {
        shopCartId: shopCart.id,
        postOptionKey: postOptionKey || null,
        shippingMeta: shippingMeta || null,

        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',

        fullName,
        phone: normalizeFa(address?.phone) || normalizeFa(dbUser?.phone) || '',
        province: normalizeFa(address?.province) || '',
        city: normalizeFa(address?.city) || '',
        address1: normalizeFa(address?.address1) || '',
        postalCode: address?.postalCode
          ? String(address.postalCode).trim()
          : null,
        notes,

        subtotal: shopSubtotal,
        discountAmount: shopDiscountAmount,
        payableOnline: shopPayable + shippingCost,
        payableCOD: 0,

        shippingCost,
        shippingMethod,
        shippingTitle: shippingTitle || '',

        deliveryDate,
        deliverySlot,
      };

      if (existingOrder) {
        shopOrder = await prismadb.shopOrder.update({
          where: { id: existingOrder.id },
          data: {
            ...orderData,
            items: {
              deleteMany: {},
              createMany: { data: orderItemsData },
            },
          },
        });
      } else {
        shopOrder = await prismadb.shopOrder.create({
          data: {
            userId,
            ...orderData,
            items: { createMany: { data: orderItemsData } },
          },
        });
      }
    }

    // ----------------------------
    // 6) Payment initialization
    // ----------------------------
    const kind =
      hasCoursesInput && hasShopInput
        ? 'BOTH'
        : hasShopInput
          ? 'SHOP'
          : 'DIGITAL';

    const amountInRial = Math.max(0, toInt(onlinePayable, 0)) * 10;

    const description = buildDefaultDesc({
      hasCourses: hasCoursesInput,
      hasShop: hasShopInput,
    });

    const initializedPayment = await initializeOnlinePayment({
      userId,

      cartId: hasCoursesInput ? cartId : null,

      shopOrderId: hasShopInput && shopOrder?.id ? shopOrder.id : null,

      amountInRial,
      kind,
      description,
      log,
    });

    log.info(
      {
        event: 'checkout_payment_initialized',

        paymentId: initializedPayment.paymentId,

        cartId,
        shopOrderId: shopOrder?.id ?? null,

        kind,

        gatewayRedirectReused: initializedPayment.reused,
      },
      'Checkout payment initialized'
    );

    return NextResponse.json(
      {
        success: true,

        redirectUrl: initializedPayment.redirectUrl,

        paymentId: initializedPayment.paymentId,

        shopOrderId: shopOrder?.id ?? null,
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (error instanceof DiscountReservationError) {
      log.warn(
        {
          event: 'checkout_discount_reservation_rejected',

          userId,

          status: error.status,
          reasonCode: error.code,
          discountCodeId: error.discountCodeId,
        },
        'Checkout discount reservation was rejected'
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    if (error instanceof PaymentInitializationError) {
      log.warn(
        {
          event: 'checkout_payment_initialization_rejected',

          userId,

          status: error.status,
          reasonCode: error.code,
        },
        'Checkout payment initialization was rejected'
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    if (error instanceof PaymentGatewayError) {
      logError({
        log,
        error,

        message: 'Checkout payment gateway request failed',

        data: {
          event: 'checkout_payment_gateway_failed',

          userId,

          operation: error.operation,
          gatewayCode: error.gatewayCode,
          gatewayHttpStatus: error.httpStatus,
          retryable: error.retryable,
        },
      });

      return NextResponse.json(
        {
          success: false,

          error:
            'اتصال به درگاه پرداخت با خطا مواجه شد. کمی بعد دوباره تلاش کنید.',
        },
        {
          status: 502,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const expectedStatus = Number(error?.status);

    if (
      Number.isInteger(expectedStatus) &&
      expectedStatus >= 400 &&
      expectedStatus < 500
    ) {
      log.warn(
        {
          event: 'checkout_request_rejected',

          userId,
          status: expectedStatus,
        },
        'Checkout request was rejected'
      );

      return NextResponse.json(
        {
          success: false,

          error:
            error instanceof Error
              ? error.message
              : 'درخواست پرداخت معتبر نیست.',
        },
        {
          status: expectedStatus,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    logError({
      log,
      error,

      message: 'Checkout request failed',

      data: {
        event: 'checkout_failed',
        userId,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطای داخلی سرور.',
      },
      {
        status: 500,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/checkout',
  component: 'checkout-api',
});
