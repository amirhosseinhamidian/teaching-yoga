/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ImSpinner2 } from 'react-icons/im';
import Button from '@/components/Ui/Button/Button';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import { useRouter } from 'next/navigation';
import { TbShoppingCartOff } from 'react-icons/tb';

const CartModal = ({ onClose }) => {
  const [cartData, setCartData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getCartData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          cache: 'no-store', // Ensures SSR by disabling caching
          method: 'GET',
        },
      );

      if (!res.ok) {
        console.error('Failed to fetch course data');
      }

      const data = await res.json();
      console.log(data);
      setCartData(data);
    } catch (error) {
      console.error('Error fetch course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCartData();
  }, []);

  const goToPayment = () => {
    router.push('/payment');
    onClose();
  };

  const goToCart = () => {
    router.push('/cart');
    onClose();
  };

  const getCoursePrice = (coursePrice) => {
    return coursePrice === 0 ? (
      <h3 className='font-faNa text-xs sm:text-sm'>رایگان</h3>
    ) : (
      <div className='flex items-baseline gap-1'>
        <h3 className='font-faNa text-xs sm:text-sm'>
          {coursePrice.toLocaleString('fa-IR')}
        </h3>
        <h6 className='text-2xs sm:text-xs'>تومان</h6>
      </div>
    );
  };

  const getTotalPrice = (totalPrice) => {
    return totalPrice === 0 ? (
      <h3 className='font-faNa text-sm sm:text-base'>رایگان</h3>
    ) : (
      <div className='flex items-baseline gap-1'>
        <h3 className='font-faNa text-sm sm:text-base'>
          {totalPrice.toLocaleString('fa-IR')}
        </h3>
        <h6 className='text-2xs sm:text-xs'>تومان</h6>
      </div>
    );
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div className='absolute left-7 top-14 w-60 rounded-xl bg-surface-light p-4 xs:left-14 xs:w-[300px] sm:w-96 dark:bg-background-dark'>
        {isLoading ? (
          <div className='flex min-h-36 min-w-52 items-center justify-center sm:min-h-48 md:min-h-60'>
            <ImSpinner2 className='animate-spin text-secondary' size={42} />
          </div>
        ) : (
          <>
            {cartData?.cart?.courses.length !== 0 ? (
              <div>
                <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
                  سبد خرید
                </h2>
                {cartData.cart.courses.map((course, index) => (
                  <div key={course.courseId}>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap'>
                        <Image
                          src={course.courseCoverImage}
                          alt={course.courseTitle}
                          width={280}
                          height={160}
                          className='h-8 w-12 rounded-lg object-cover xs:h-12 xs:w-16'
                        />
                        <h3 className='text-xs font-thin md:text-sm'>
                          {course.courseTitle}
                        </h3>
                      </div>
                      {getCoursePrice(course.finalPrice)}
                    </div>
                    {index < cartData.cart.courses.length - 1 && (
                      <hr className='mx-4 my-3 border-t border-gray-300 dark:border-gray-700' />
                    )}
                  </div>
                ))}

                <hr className='my-5 border-t border-gray-300 dark:border-gray-700' />
                <div className='flex items-center justify-between gap-2'>
                  <h3 className='text-sm sm:text-base'>مبلغ کل</h3>
                  {getTotalPrice(cartData.cart.totalPrice)}
                </div>
                <div className='mt-5 flex w-full flex-wrap gap-2'>
                  {cartData.cart.totalPrice !== 0 && (
                    <Button
                      className='flex-1 whitespace-nowrap text-xs xs:text-sm sm:text-base'
                      onClick={goToPayment}
                    >
                      پرداخت
                    </Button>
                  )}
                  <OutlineButton
                    className='flex-1 whitespace-nowrap text-xs xs:text-sm sm:text-base'
                    onClick={goToCart}
                  >
                    سبد خرید
                  </OutlineButton>
                </div>
              </div>
            ) : (
              <div className='flex min-h-36 min-w-52 flex-col items-center justify-center gap-4 sm:min-h-48 md:min-h-60'>
                <TbShoppingCartOff size={42} className='text-secondary' />
                <span className='text-secondary'>سبد خرید خالی است.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
