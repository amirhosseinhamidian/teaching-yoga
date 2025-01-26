/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import CourseItemsCard from '@/components/templates/cart/CourseItemsCard';
import DetailOrderCard from '@/components/templates/cart/DetailOrderCard';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import { GoAlert } from 'react-icons/go';
import { BsHandbag } from 'react-icons/bs';
import { ImSpinner2 } from 'react-icons/im';

const fetchCartData = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        cache: 'no-store', // جلوگیری از کش شدن داده‌ها
        method: 'GET',
      },
    );

    if (!res.ok) {
      throw new Error('Failed to fetch cart data');
    }

    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

const CartMain = () => {
  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // بارگذاری داده‌ها در زمان اولین رندر کامپوننت
  useEffect(() => {
    const loadCartData = async () => {
      setIsLoading(true);
      const data = await fetchCartData();

      if (data) {
        setCartData(data);
      } else {
        console.error('Error in Fetch Cart Data');
      }
      setIsLoading(false);
    };

    loadCartData();
  }, []);

  const handleDeleteItem = async () => {
    const updatedCartData = await fetchCartData();
    if (updatedCartData) {
      setCartData(updatedCartData);
    } else {
      console.error('خطا در به‌روزرسانی سبد خرید.');
    }
  };

  return (
    <div className='container'>
      {isLoading ? (
        <div className='my-28 flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
          <ImSpinner2 size={46} className='animate-spin text-secondary' />
          <h2 className='text-center text-base font-semibold text-secondary md:text-xl'>
            در حال دریافت اطلاعات سبد خرید...
          </h2>
        </div>
      ) : (
        <>
          {cartData && cartData?.cart?.courses.length !== 0 ? (
            <>
              <PageCheckoutTitle isSuccess={true} icon={BsHandbag}>
                سبد خرید
              </PageCheckoutTitle>
              <div className='mb-5 mt-4 grid grid-cols-1 gap-10 md:mb-8 md:mt-8 md:grid-cols-2 lg:gap-28'>
                <CourseItemsCard
                  data={cartData.cart}
                  className='order-last self-start md:order-first'
                  onDeleteItem={handleDeleteItem}
                />
                <DetailOrderCard
                  data={cartData.cart}
                  className='order-first self-start md:order-last'
                />
              </div>
              <div className='mb-10 flex items-start gap-1 text-blue md:mb-16'>
                <GoAlert size={56} className='ml-2 min-h-6 min-w-6' />
                <p className='text-xs'>
                  هزینه دوره‌ها براساس ترم‌های آن محاسبه می‌شود. در صورتی که
                  دوره‌هایی با ترم یا ترم‌های مشابه در سبد خرید باشد، هزینه آن
                  یک‌بار محاسبه می‌شود. همچنین اگر ترمی در سبد خرید وجود داشته
                  باشد که قبلاً توسط شما خریداری شده باشد، هزینه آن از دوره جدید
                  کسر خواهد شد.
                </p>
              </div>
            </>
          ) : (
            <div className='my-28 flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
              <BsHandbag size={46} className='text-secondary' />
              <h2 className='text-center text-base font-semibold text-secondary md:text-xl'>
                سبد خرید شما خالی است.
              </h2>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartMain;
