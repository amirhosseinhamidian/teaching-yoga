/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const formatToman = (n) => {
  const num = Number(n || 0);
  return `${num.toLocaleString('fa-IR')} تومان`;
};

const humanizeShopStatus = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';
    case 'PROCESSING':
      return 'در حال پردازش';
    case 'PACKED':
      return 'آماده‌سازی شده';
    case 'SHIPPED':
      return 'ارسال شده';
    case 'DELIVERED':
      return 'تحویل داده شده';
    case 'CANCELLED':
      return 'لغو شده';
    case 'RETURNED':
      return 'مرجوع شده';
    default:
      return status || '—';
  }
};

const humanizePaymentStatus = (status) => {
  const s = String(status || '').toUpperCase();
  switch (s) {
    case 'PENDING':
      return 'در انتظار پرداخت';
    case 'SUCCESSFUL':
      return 'موفق';
    case 'FAILED':
      return 'ناموفق';
    default:
      return status || '—';
  }
};

const PaymentSuccessfully = ({ paymentDetails, transactionId }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const [shortAddressClick, setShortAddressClick] = useState('');
  const [isClickLoading, setIsClickLoading] = useState(false);

  // --------- course/subscription data ----------
  const cart = paymentDetails?.cart || {};
  const cartCourses = cart?.cartCourses || [];
  const cartSubscriptions = cart?.cartSubscriptions || [];

  const courses = useMemo(
    () => cartCourses.map((cc) => cc.course).filter(Boolean),
    [cartCourses]
  );

  const subscriptionPlans = useMemo(
    () =>
      cartSubscriptions.map((item) => item.subscriptionPlan).filter(Boolean),
    [cartSubscriptions]
  );

  const isOnlySubscriptionPurchase =
    subscriptionPlans.length > 0 && courses.length === 0;

  // --------- shop data ----------
  const shopOrder = paymentDetails?.shopOrder || null;
  const shopItems = shopOrder?.items || [];
  const hasShopPurchase =
    !!shopOrder && Array.isArray(shopItems) && shopItems.length > 0;

  const shopTotals = useMemo(() => {
    if (!hasShopPurchase) return null;

    const subtotal = Number(shopOrder?.subtotal || 0);
    const discountAmount = Number(shopOrder?.discountAmount || 0);
    const shippingCost = Number(shopOrder?.shippingCost || 0);
    const payableOnline = Number(shopOrder?.payableOnline || 0);

    // اگر payableOnline در DB نگهداری می‌کنی، همون را نشان بده
    // وگرنه می‌تونستیم محاسبه کنیم:
    // const computed = Math.max(subtotal - discountAmount + shippingCost, 0);

    return {
      subtotal,
      discountAmount,
      shippingCost,
      payableOnline,
    };
  }, [hasShopPurchase, shopOrder]);

  const handleCourseClick = async (shortAddress) => {
    setShortAddressClick(shortAddress);
    setIsClickLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/first-session`
      );

      if (response.ok) {
        const { sessionId } = await response.json();
        router.replace(`/courses/${shortAddress}/lesson/${sessionId}`);
      } else {
        toast.showErrorToast('خطای غیرمنتظره');
      }
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsClickLoading(false);
      setShortAddressClick('');
    }
  };

  const handleTrackOrder = () => {
    // مسیر را با مسیر واقعی صفحه سفارش‌های پروفایل خودت تنظیم کن
    // پیشنهاد: صفحه لیست سفارش‌ها یا صفحه جزئیات با orderId
    const orderId = shopOrder?.id;
    if (orderId) {
      router.replace(`/profile/orders?orderId=${orderId}`);
      return;
    }
    router.replace('/profile');
  };

  // =========================
  //  UI Blocks
  // =========================

  const HeaderBlock = (
    <>
      <h2 className='text-center text-base font-semibold text-secondary xs:text-lg md:text-xl lg:text-2xl'>
        {transactionId
          ? 'خرید شما با موفقیت انجام شد'
          : 'پرداخت با موفقیت انجام شد'}
      </h2>

      {transactionId && (
        <h3 className='text-center font-faNa text-sm'>
          کد پیگیری پرداخت: {transactionId}
        </h3>
      )}
    </>
  );

  // ✅ حالت: فقط اشتراک (و هیچ دوره‌ای نیست) و خرید فروشگاه هم نیست
  if (isOnlySubscriptionPurchase && !hasShopPurchase) {
    const plan = subscriptionPlans[0];

    return (
      <div className='my-12 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 xs:p-6 dark:bg-surface-dark'>
        <h2 className='text-center text-base font-semibold text-secondary xs:text-lg md:text-xl lg:text-2xl'>
          خرید اشتراک با موفقیت انجام شد
        </h2>

        {transactionId && (
          <h3 className='text-center font-faNa text-sm'>
            کد پیگیری پرداخت: {transactionId}
          </h3>
        )}

        {plan && (
          <div className='mt-2 w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-500 dark:bg-emerald-900 dark:text-emerald-100'>
            <p>
              پلن انتخابی: <span className='font-bold'>{plan.name}</span>
            </p>

            {plan.intervalLabel && (
              <p className='mt-1'>
                بازه اشتراک:{' '}
                <span className='font-semibold'>{plan.intervalLabel}</span>
              </p>
            )}

            {typeof plan.durationInDays === 'number' &&
              plan.durationInDays > 0 && (
                <p className='mt-1'>
                  مدت اشتراک:{' '}
                  <span className='font-semibold'>
                    {plan.durationInDays.toLocaleString('fa-IR')} روز
                  </span>
                </p>
              )}

            <p className='mt-2'>
              اگر در حال حاضر اشتراک فعالی دارید، این اشتراک جدید بلافاصله بعد
              از پایان اشتراک فعلی شما به صورت خودکار فعال می‌شود و روزهای آن به
              انتهای اشتراک قبلی اضافه می‌شود.
            </p>
          </div>
        )}

        <div className='mt-4 flex flex-wrap justify-center gap-3'>
          <Button
            shadow
            className='text-xs sm:text-sm'
            onClick={() => router.replace('/subscriptions')}
          >
            مشاهده اشتراک‌ها
          </Button>
          <Button
            variant='outline'
            className='text-xs sm:text-sm'
            onClick={() => router.replace('/')}
          >
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    );
  }

  // ✅ حالت عمومی: ممکنه دوره/اشتراک/محصول یا ترکیبی باشد
  return (
    <div className='my-12 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 xs:p-6 dark:bg-surface-dark'>
      {HeaderBlock}

      {/* ======= Courses section ======= */}
      {courses.length > 0 ? (
        <div className='mt-2 w-full max-w-2xl'>
          <h3 className='mb-2 text-sm font-semibold'>دوره‌های خریداری‌شده</h3>

          <div className='rounded-xl border border-gray-200 dark:border-gray-700'>
            {courses.map((course) => (
              <div
                key={course.id}
                className='flex w-full flex-wrap items-center justify-between gap-2 border-b border-gray-200 p-3 last:border-b-0 dark:border-gray-700'
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <Image
                    src={course.cover}
                    alt={course.title}
                    width={360}
                    height={280}
                    className='h-9 w-14 rounded-lg object-cover xs:h-14 xs:w-20 sm:h-20 sm:w-28'
                  />
                  <h5 className='text-xs sm:text-base'>{course.title}</h5>
                </div>

                <Button
                  shadow
                  className='text-xs sm:text-base'
                  onClick={() => handleCourseClick(course.shortAddress)}
                  isLoading={
                    isClickLoading && shortAddressClick === course.shortAddress
                  }
                >
                  مشاهده دوره
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : subscriptionPlans.length > 0 ? (
        // اگر دوره نیست ولی اشتراک هست (و ممکنه فروشگاه هم هست)
        <div className='mt-2 w-full max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-500 dark:bg-emerald-900 dark:text-emerald-100'>
          <p className='font-semibold'>اشتراک شما با موفقیت فعال شد.</p>
          <p className='mt-1'>
            پلن‌ها:{' '}
            {subscriptionPlans
              .map((p) => p.name)
              .filter(Boolean)
              .join('، ')}
          </p>
        </div>
      ) : (
        <p className='mt-2 text-xs text-slate-600 dark:text-slate-300'>
          پرداخت با موفقیت انجام شد و دسترسی شما به محتوای خریداری‌شده فعال
          گردید.
        </p>
      )}

      {/* ======= Shop section ======= */}
      {hasShopPurchase && (
        <div className='mt-2 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold'>جزئیات سفارش فروشگاه</h3>

            <div className='flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-200'>
              <span className='rounded-lg bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                وضعیت سفارش: {humanizeShopStatus(shopOrder?.status)}
              </span>
              <span className='rounded-lg bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                وضعیت پرداخت: {humanizePaymentStatus(shopOrder?.paymentStatus)}
              </span>
            </div>
          </div>

          {/* items */}
          <div className='mt-4 space-y-3'>
            {shopItems.map((it) => (
              <div
                key={it.id}
                className='flex items-center justify-between gap-3 border-b border-gray-200 pb-3 last:border-b-0 last:pb-0 dark:border-gray-700'
              >
                <div className='flex items-center gap-3'>
                  {it.coverImage ? (
                    <Image
                      src={it.coverImage}
                      alt={it.title}
                      width={96}
                      height={96}
                      className='h-12 w-12 rounded-lg object-cover'
                    />
                  ) : (
                    <div className='h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800' />
                  )}

                  <div className='flex flex-col'>
                    <span className='text-sm'>{it.title}</span>
                    <span className='text-xs text-slate-500 dark:text-slate-300'>
                      تعداد: {Number(it.qty || 1).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col items-end'>
                  <span className='text-xs text-slate-600 dark:text-slate-200'>
                    {formatToman(it.unitPrice)}
                  </span>
                  <span className='text-[11px] text-slate-500 dark:text-slate-300'>
                    جمع:{' '}
                    {formatToman(
                      Number(it.unitPrice || 0) * Number(it.qty || 1)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* totals */}
          {shopTotals && (
            <div className='mt-4 rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-900'>
              <div className='flex items-center justify-between'>
                <span className='text-slate-600 dark:text-slate-200'>
                  جمع سبد
                </span>
                <span className='font-faNa'>
                  {formatToman(shopTotals.subtotal)}
                </span>
              </div>

              <div className='mt-2 flex items-center justify-between'>
                <span className='text-slate-600 dark:text-slate-200'>
                  تخفیف
                </span>
                <span className='font-faNa'>
                  {formatToman(shopTotals.discountAmount)}
                </span>
              </div>

              <div className='mt-2 flex items-center justify-between'>
                <span className='text-slate-600 dark:text-slate-200'>
                  هزینه ارسال
                </span>
                <span className='font-faNa'>
                  {formatToman(shopTotals.shippingCost)}
                </span>
              </div>

              <div className='mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700'>
                <span className='font-semibold'>مبلغ پرداختی سفارش</span>
                <span className='font-faNa font-semibold'>
                  {formatToman(shopTotals.payableOnline)}
                </span>
              </div>

              {shopOrder?.shippingTitle ? (
                <p className='mt-2 text-[11px] text-slate-500 dark:text-slate-300'>
                  روش ارسال: {shopOrder.shippingTitle}
                </p>
              ) : null}

              {shopOrder?.trackingCode ? (
                <p className='mt-1 text-[11px] text-slate-500 dark:text-slate-300'>
                  کد رهگیری مرسوله: {shopOrder.trackingCode}
                </p>
              ) : null}
            </div>
          )}

          <div className='mt-4 flex flex-wrap justify-center gap-3'>
            <Button
              shadow
              className='text-xs sm:text-sm'
              onClick={handleTrackOrder}
            >
              پیگیری سفارش
            </Button>
            <Button
              variant='outline'
              className='text-xs sm:text-sm'
              onClick={() => router.replace('/shop/products')}
            >
              سایر محصولات
            </Button>
          </div>
        </div>
      )}

      {/* footer actions */}
      <div className='mt-4 flex flex-wrap justify-center gap-3'>
        {subscriptionPlans.length > 0 && (
          <Button
            shadow
            className='text-xs sm:text-sm'
            onClick={() => router.replace('/subscriptions')}
          >
            مشاهده اشتراک‌ها
          </Button>
        )}

        <Button
          variant='outline'
          className='text-xs sm:text-sm'
          onClick={() => router.replace('/')}
        >
          بازگشت به صفحه اصلی
        </Button>
      </div>
    </div>
  );
};

PaymentSuccessfully.propTypes = {
  paymentDetails: PropTypes.shape({
    transactionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cart: PropTypes.shape({
      cartCourses: PropTypes.array,
      cartSubscriptions: PropTypes.array,
    }),
    shopOrder: PropTypes.shape({
      id: PropTypes.number,
      status: PropTypes.string,
      paymentStatus: PropTypes.string,
      trackingCode: PropTypes.string,
      shippingTitle: PropTypes.string,
      shippingMethod: PropTypes.string,
      shippingCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      subtotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      discountAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      payableOnline: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      payableCOD: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      createdAt: PropTypes.any,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number,
          productId: PropTypes.number,
          qty: PropTypes.number,
          title: PropTypes.string,
          unitPrice: PropTypes.number,
          coverImage: PropTypes.string,
          slug: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
  transactionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default PaymentSuccessfully;
