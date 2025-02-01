/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { MdOutlineDiscount } from 'react-icons/md';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const DetailOrderCard = ({ data, setCartData, className }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const toast = createToastHandler(isDark);
  const [discountCode, setDiscountCode] = useState('');
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [addDiscountCodeLoading, setAddDiscountCodeLoading] = useState(false);
  const router = useRouter();

  const getDiscount = (discount) => {
    return discount === 0 ? (
      <h3 className='font-faNa text-base font-semibold sm:text-lg'>-</h3>
    ) : (
      <>
        <h3 className='font-faNa text-base font-semibold sm:text-lg'>
          {discount.toLocaleString('fa-IR')}
        </h3>
        <h6 className='text-2xs sm:text-xs'>تومان</h6>
      </>
    );
  };

  const getPriceWithoutDiscount = (price) => {
    return price === 0 ? (
      <h3 className='font-faNa text-base font-semibold sm:text-lg'>رایگان</h3>
    ) : (
      <div className='flex items-baseline gap-1'>
        <h3 className='font-faNa text-base font-semibold sm:text-lg'>
          {price.toLocaleString('fa-IR')}
        </h3>
        <h6 className='text-2xs sm:text-xs'>تومان</h6>
      </div>
    );
  };

  const getTotalPrice = (price) => {
    return price === 0 ? (
      <h3 className='font-faNa text-lg font-semibold text-green sm:text-xl'>
        رایگان
      </h3>
    ) : (
      <div className='flex items-baseline gap-1 text-green'>
        <h3 className='font-faNa text-lg font-semibold sm:text-xl'>
          {price.toLocaleString('fa-IR')}
        </h3>
        <h6 className='text-2xs sm:text-xs'>تومان</h6>
      </div>
    );
  };

  const addFreeCourse = async (courses, cartId) => {
    try {
      // استخراج آرایه از courseId ها
      const courseIds = courses.map((course) => course.courseId);

      setAddCourseLoading(true);

      // ارسال داده‌ها به API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/courses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ courseIds, cartId }), // ارسال لیست آی‌دی‌های دوره‌ها و شناسه سبد خرید
        },
      );

      // بررسی وضعیت پاسخ
      if (!response.ok) {
        throw new Error('Failed to add courses');
      }

      // دریافت پاسخ از API
      const data = await response.json();

      // استخراج paymentId از پاسخ
      const paymentId = data.paymentId;

      // انتقال به صفحه تکمیل پرداخت
      router.replace(`/complete-payment?token=${paymentId}&status=OK`);
    } catch (error) {
      console.error('Error adding courses:', error);
      // انتقال به صفحه خطا
      router.replace('/complete-payment?status=NOK');
    } finally {
      setAddCourseLoading(false);
    }
  };

  const applyDiscountCode = async () => {
    if (!discountCode) return;
    try {
      setAddDiscountCodeLoading(true);
      const response = await fetch('/api/apply-discount-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountCode,
          cartId: data.id,
          userId: user.id,
        }),
      });

      // بررسی پاسخ API
      const result = await response.json();

      if (response.ok && result.success) {
        setCartData((prev) => ({
          ...prev,
          totalDiscount: result.data.totalDiscount,
          totalPrice: result.data.totalPrice - result.data.totalDiscount,
          discountCodeId: result.data.discountCodeId,
        }));
        toast.showSuccessToast(`تخفیف با موفقیت اعمال شد.`);
      } else {
        console.error('خطا:', result.message);
        toast.showErrorToast(result.message);
      }
    } catch (error) {
      console.error('خطای درخواست:', error);
      toast.showErrorToast('خطا در برقراری ارتباط با سرور.');
    } finally {
      setAddDiscountCodeLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      // تأخیر یک ثانیه‌ای برای بررسی cartData
      const timeout = setTimeout(() => {
        console.log('یک ثانیه بعد از آپدیت cartData:', data);
        // سایر عملیات روی cartData
      }, 1000);

      // پاک کردن تایمر برای جلوگیری از مشکلات احتمالی
      return () => clearTimeout(timeout);
    }
  }, [data]);

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 shadow sm:p-8 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>جزئیات سفارش</h2>
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-medium'>کل مبلغ</h3>
        {getPriceWithoutDiscount(data.totalPriceWithoutDiscount)}
      </div>
      <div className='mt-2 flex w-full items-center justify-between sm:mt-3'>
        <h3 className='font-medium'>تخفیف</h3>
        <div className='flex items-baseline gap-1 text-red'>
          {getDiscount(data.totalDiscount)}
        </div>
      </div>
      <hr className='my-3 border-t border-gray-300 sm:my-4 dark:border-gray-700' />
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-medium'>مبلغ قابل پرداخت</h3>
        {getTotalPrice(data.totalPrice)}
      </div>
      {data.totalPrice !== 0 ? (
        <>
          <div className='mx-auto my-10 flex w-full items-center gap-2 sm:flex-wrap sm:gap-4 xl:w-3/4'>
            <div className='relative w-full xs:flex-1'>
              <Input
                value={discountCode}
                onChange={setDiscountCode}
                placeholder='کد تخفیف'
                fontDefault={false}
                className='w-full pr-10'
                maxLength={20}
                isUppercase
              />
              <MdOutlineDiscount
                size={20}
                className='absolute right-2 top-2.5 text-subtext-light dark:text-subtext-dark'
              />
            </div>
            <Button
              className='text-xs sm:text-sm'
              shadow
              isLoading={addDiscountCodeLoading}
              onClick={applyDiscountCode}
            >
              ثبت
            </Button>
          </div>
          <Link className='flex w-full justify-center' href='/payment'>
            <Button
              className='mb-2 flex w-full items-center justify-center gap-1 sm:mb-4'
              shadow
            >
              تایید و ادامه پرداخت
            </Button>
          </Link>
        </>
      ) : (
        <Button
          className='mb-2 mt-10 w-full sm:mb-4'
          shadow
          isLoading={addCourseLoading}
          onClick={() => addFreeCourse(data.courses, data.id)}
        >
          افزودن دوره
        </Button>
      )}
    </div>
  );
};

DetailOrderCard.propTypes = {
  data: PropTypes.object.isRequired,
  setCartData: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default DetailOrderCard;
