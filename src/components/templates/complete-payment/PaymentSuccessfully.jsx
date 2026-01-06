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

const Badge = ({ className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${className}`}
  >
    {children}
  </span>
);
Badge.propTypes = { className: PropTypes.string, children: PropTypes.node };

const statusBadgeClass = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDING_PAYMENT')
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  if (s === 'PROCESSING')
    return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30';
  if (s === 'PACKED')
    return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30';
  if (s === 'SHIPPED')
    return 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30';
  if (s === 'DELIVERED')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (s === 'CANCELLED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';
  if (s === 'RETURNED')
    return 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/30';
  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
};

const paymentBadgeClass = (paymentStatus) => {
  const s = String(paymentStatus || '').toUpperCase();
  if (s === 'SUCCESSFUL')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (s === 'FAILED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';
  if (s === 'PENDING')
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
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
        <p className='mt-2 text-xs text-subtext-light dark:text-subtext-dark'>
          پرداخت با موفقیت انجام شد و می توانید از بخش سفارشات پروفایل کاربری ،
          وضعیت سفارش را پیگیری کنید.
        </p>
      )}

      {/* ======= Shop section ======= */}
      {hasShopPurchase && (
        <div className='mt-2 w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <h3 className='text-sm font-semibold'>جزئیات سفارش فروشگاه</h3>

            <div className='flex flex-wrap items-center gap-2'>
              <Badge className={statusBadgeClass(shopOrder?.status)}>
                وضعیت سفارش: {humanizeShopStatus(shopOrder?.status)}
              </Badge>
              <Badge className={paymentBadgeClass(shopOrder?.paymentStatus)}>
                وضعیت پرداخت: {humanizePaymentStatus(shopOrder?.paymentStatus)}
              </Badge>
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
                    <span className='text-xs text-slate-500 dark:text-subtext-dark'>
                      تعداد: {Number(it.qty || 1).toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className='flex flex-col items-end'>
                  <span className='text-xs text-subtext-light dark:text-subtext-dark'>
                    {formatToman(it.unitPrice)}
                  </span>
                  <span className='text-[11px] text-slate-500 dark:text-subtext-dark'>
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
            <div className='mt-4 rounded-xl bg-gray-50 p-3 text-xs dark:bg-foreground-dark/30'>
              <div className='flex items-center justify-between'>
                <span className='text-subtext-light dark:text-subtext-dark'>
                  جمع سبد
                </span>
                <span className='font-faNa'>
                  {formatToman(shopTotals.subtotal)}
                </span>
              </div>

              <div className='mt-2 flex items-center justify-between'>
                <span className='text-subtext-light dark:text-subtext-dark'>
                  تخفیف
                </span>
                <span
                  className={`font-faNa ${shopTotals.discountAmount !== 0 && 'text-red'}`}
                >
                  {shopTotals.discountAmount === 0
                    ? '-'
                    : formatToman(shopTotals.discountAmount)}
                </span>
              </div>

              <div className='mt-2 flex items-center justify-between'>
                <span className='text-subtext-light dark:text-subtext-dark'>
                  هزینه ارسال
                </span>
                {shopOrder?.shippingMethod === 'POST' ? (
                  <span className='font-faNa'>
                    {shopOrder?.postOptionKey === 'FALLBACK_POST_FAST' &&
                    shopTotals?.shippingCost === 0 ? (
                      <span className='text-red'>
                        هزینه ارسال بعدا محاسبه می شود.
                      </span>
                    ) : shopTotals?.shippingCost === 0 ? (
                      'رایگان'
                    ) : (
                      formatToman(shopTotals?.shippingCost)
                    )}
                  </span>
                ) : (
                  <span>در محل</span>
                )}
              </div>

              <div className='mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700'>
                <span className='font-semibold'>مبلغ پرداختی سفارش</span>
                <span className='font-faNa font-semibold'>
                  {formatToman(shopTotals.payableOnline)}
                </span>
              </div>

              {shopOrder?.shippingTitle ? (
                <p className='mt-2 text-[11px] text-slate-500 dark:text-subtext-dark'>
                  روش ارسال: {shopOrder.shippingTitle}
                </p>
              ) : null}

              {shopOrder?.trackingCode ? (
                <p className='mt-1 text-[11px] text-slate-500 dark:text-subtext-dark'>
                  کد رهگیری مرسوله: {shopOrder.trackingCode}
                </p>
              ) : null}
            </div>
          )}

          <div className='mt-4 flex flex-wrap justify-center gap-3'>
            <Button
              shadow
              className='text-xs sm:text-sm'
              onClick={() => router.push('/profile?active=1')}
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
