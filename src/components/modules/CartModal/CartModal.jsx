'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { ImSpinner2 } from 'react-icons/im';
import Button from '@/components/Ui/Button/Button';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import { TbShoppingCartOff } from 'react-icons/tb';
import { useRouter } from 'next/navigation';

// Redux
import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';

// eslint-disable-next-line react/prop-types
export default function CartModal({ onClose }) {
  const router = useRouter();

  // دوره‌ها
  const {
    items: courseItems,
    loading: courseLoading,
    totalPrice: coursePayable,
  } = useCart();

  // محصولات
  const {
    items: shopItems,
    loading: shopLoading,
    subtotal: shopPayable,
  } = useShopCart();

  const loading = courseLoading || shopLoading;

  const hasCourseItems = Array.isArray(courseItems) && courseItems.length > 0;
  const hasShopItems = Array.isArray(shopItems) && shopItems.length > 0;

  const shopQty = useMemo(() => {
    if (!hasShopItems) return 0;
    return shopItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  }, [hasShopItems, shopItems]);

  const grandPayable = useMemo(() => {
    const c = Number(coursePayable || 0);
    const s = Number(shopPayable || 0);
    return c + s;
  }, [coursePayable, shopPayable]);

  const goToPayment = () => {
    router.push('/payment');
    onClose();
  };

  const goToCart = () => {
    router.push('/cart');
    onClose();
  };

  const formatPrice = (v) => {
    const n = Number(v || 0);
    return n === 0 ? 'رایگان' : n.toLocaleString('fa-IR');
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='absolute left-7 top-14 w-60 rounded-xl bg-surface-light p-4 xs:left-14 xs:w-[300px] sm:w-96 dark:bg-background-dark'
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className='flex min-h-36 min-w-52 items-center justify-center sm:min-h-48 md:min-h-60'>
            <ImSpinner2 className='animate-spin text-secondary' size={42} />
          </div>
        ) : hasCourseItems || hasShopItems ? (
          <>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-sm font-semibold xs:text-base md:text-lg'>
                سبد خرید
              </h2>
              <div className='flex items-center gap-2 text-2xs text-subtext-light dark:text-subtext-dark'>
                {hasCourseItems && (
                  <span className='rounded-lg bg-foreground-light px-2 py-1 dark:bg-foreground-dark'>
                    دوره‌ها: {courseItems.length.toLocaleString('fa-IR')}
                  </span>
                )}
                {hasShopItems && (
                  <span className='rounded-lg bg-foreground-light px-2 py-1 dark:bg-foreground-dark'>
                    محصولات: {shopQty.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>
            </div>

            {/* Courses */}
            {hasCourseItems && (
              <div className='mb-4 rounded-xl bg-foreground-light p-3 dark:bg-foreground-dark'>
                <h3 className='mb-2 text-xs font-semibold xs:text-sm'>
                  دوره‌ها
                </h3>

                {courseItems.map((course, index) => (
                  <div key={course.courseId}>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <Image
                          src={course.courseCoverImage}
                          alt={course.courseTitle}
                          width={280}
                          height={160}
                          className='h-8 w-12 rounded-lg object-cover xs:h-12 xs:w-16'
                        />
                        <h4 className='text-xs font-thin md:text-sm'>
                          {course.courseTitle}
                        </h4>
                      </div>

                      <div className='flex items-baseline gap-1'>
                        <span className='font-faNa text-xs sm:text-sm'>
                          {course.finalPrice === 0
                            ? 'رایگان'
                            : formatPrice(course.finalPrice)}
                        </span>
                        {course.finalPrice !== 0 && (
                          <span className='text-2xs sm:text-xs'>تومان</span>
                        )}
                      </div>
                    </div>

                    {index < courseItems.length - 1 && (
                      <hr className='mx-2 my-3 border-t border-gray-300 dark:border-gray-700' />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Shop products */}
            {hasShopItems && (
              <div className='mb-4 rounded-xl bg-foreground-light p-3 dark:bg-foreground-dark'>
                <h3 className='mb-2 text-xs font-semibold xs:text-sm'>
                  محصولات
                </h3>

                {shopItems.map((item, index) => {
                  const lineTotal =
                    Number(item.unitPrice || 0) * Number(item.qty || 0);

                  return (
                    <div key={item.id}>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <Image
                            src={item.coverImage}
                            alt={item.productTitle}
                            width={280}
                            height={160}
                            className='h-8 w-12 rounded-lg object-cover xs:h-12 xs:w-16'
                          />

                          <div className='flex flex-col'>
                            <h4 className='text-xs font-thin md:text-sm'>
                              {item.productTitle}
                            </h4>

                            <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                              <span className='font-faNa text-2xs text-subtext-light dark:text-subtext-dark'>
                                تعداد:{' '}
                                {Number(item.qty || 0).toLocaleString('fa-IR')}
                              </span>

                              {/* رنگ */}
                              {item?.color?.name && (
                                <span className='flex items-center gap-1 rounded-lg bg-foreground-light px-2 py-0.5 text-2xs text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
                                  <span>رنگ:</span>
                                  <span className='font-faNa'>
                                    {item.color.name}
                                  </span>
                                  {item?.color?.hex && (
                                    <span
                                      className='h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10'
                                      style={{
                                        backgroundColor: item.color.hex,
                                      }}
                                      title={item.color.hex}
                                    />
                                  )}
                                </span>
                              )}

                              {/* سایز */}
                              {item?.size?.name && (
                                <span className='rounded-lg bg-foreground-light px-2 py-0.5 text-2xs text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
                                  سایز:{' '}
                                  <span className='font-faNa'>
                                    {item.size.name}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='flex items-baseline gap-1'>
                          <span className='font-faNa text-xs sm:text-sm'>
                            {lineTotal === 0
                              ? 'رایگان'
                              : formatPrice(lineTotal)}
                          </span>
                          {lineTotal !== 0 && (
                            <span className='text-2xs sm:text-xs'>تومان</span>
                          )}
                        </div>
                      </div>

                      {index < shopItems.length - 1 && (
                        <hr className='mx-2 my-3 border-t border-gray-300 dark:border-gray-700' />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <hr className='my-4 border-t border-gray-300 dark:border-gray-700' />

            {/* Grand total */}
            <div className='flex items-center justify-between'>
              <h3 className='text-sm sm:text-base'>مبلغ کل</h3>

              {grandPayable === 0 ? (
                <h3 className='font-faNa text-sm sm:text-base'>رایگان</h3>
              ) : (
                <div className='flex items-baseline gap-1'>
                  <h3 className='font-faNa text-sm sm:text-base'>
                    {formatPrice(grandPayable)}
                  </h3>
                  <h6 className='text-2xs sm:text-xs'>تومان</h6>
                </div>
              )}
            </div>

            <div className='mt-5 flex w-full flex-wrap gap-2'>
              {grandPayable !== 0 && (
                <Button
                  className='flex-1 whitespace-nowrap text-xs xs:text-sm sm:text-base'
                  onClick={goToPayment}
                >
                  پرداخت
                </Button>
              )}

              <Button className='' onClick={goToCart}>
                سبد خرید
              </Button>
            </div>
          </>
        ) : (
          <div className='flex min-h-36 min-w-52 flex-col items-center justify-center gap-4 sm:min-h-48 md:min-h-60'>
            <TbShoppingCartOff size={42} className='text-secondary' />
            <span className='text-secondary'>سبد خرید خالی است.</span>
          </div>
        )}
      </div>
    </div>
  );
}
