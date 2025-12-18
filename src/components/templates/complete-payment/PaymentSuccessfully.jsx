// components/templates/complete-payment/PaymentSuccessfully.jsx
/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const PaymentSuccessfully = ({ paymentDetails, transactionId }) => {
  const [shortAddressClick, setShortAddressClick] = useState('');
  const [isClickLoading, setIsClickLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const cart = paymentDetails?.cart || {};
  const cartCourses = cart.cartCourses || [];
  const cartSubscriptions = cart.cartSubscriptions || [];

  // دوره‌هایی که در سبد بوده‌اند
  const courses = cartCourses.map((cartCourse) => cartCourse.course);

  // پلن‌های اشتراک که در سبد بوده‌اند
  const subscriptionPlans = cartSubscriptions
    .map((item) => item.subscriptionPlan)
    .filter(Boolean);

  const isOnlySubscriptionPurchase =
    subscriptionPlans.length > 0 && courses.length === 0;

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
    } finally {
      setIsClickLoading(false);
      setShortAddressClick('');
    }
  };

  // ✅ حالت: خرید فقط اشتراک
  if (isOnlySubscriptionPurchase) {
    const plan = subscriptionPlans[0]; // فعلاً اگر چند پلن بود، یکی را نمایش می‌دهیم

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

  // ✅ حالت: خرید دوره (یا ترکیب دوره + اشتراک) → دوره‌ها را نمایش بده
  return (
    <div className='my-12 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 xs:p-6 dark:bg-surface-dark'>
      <h2 className='text-center text-base font-semibold text-secondary xs:text-lg md:text-xl lg:text-2xl'>
        {transactionId
          ? 'خرید شما با موفقیت انجام شد'
          : 'دوره برای شما به طور کامل در دسترس است.'}
      </h2>

      {transactionId && (
        <h3 className='text-center font-faNa text-sm'>
          کد پیگیری پرداخت: {transactionId}
        </h3>
      )}

      {courses.length > 0 ? (
        courses.map((course) => (
          <div
            key={course.id}
            className='flex w-full flex-wrap items-center justify-between gap-2 border-t border-gray-300 py-4 xs:py-6 dark:border-gray-700'
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
        ))
      ) : (
        <p className='mt-4 text-xs text-slate-600 dark:text-slate-300'>
          پرداخت با موفقیت انجام شد و دسترسی شما به محتوای خریداری‌شده فعال
          گردید.
        </p>
      )}
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
  }).isRequired,
  transactionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default PaymentSuccessfully;
