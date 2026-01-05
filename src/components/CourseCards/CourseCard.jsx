/* eslint-disable no-undef */
'use client';
/* eslint-disable react/prop-types */
import React, { useMemo, useState } from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '../Ui/Button/Button';
import { GrYoga } from 'react-icons/gr';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import Link from 'next/link';
import { TiInfoLarge } from 'react-icons/ti';
import SubscriptionBadge from './SubscriptionBadge';

export default function CourseCard({ course, className }) {
  const router = useRouter();
  const [isEnterCourseLoading, setIsEnterCourseLoading] = useState(false);

  const isSubscriptionOnly = course?.pricingMode === 'SUBSCRIPTION_ONLY';
  const isBoth = course?.pricingMode === 'BOTH';

  const hasAccess = !!course?.hasAccess;
  const viaSubscription = !!course?.viaSubscription;
  const hasDirectCourseAccess = !!course?.hasDirectCourseAccess;

  const showSubscriptionBadgeOnly = isSubscriptionOnly;
  const showSubscriptionBadgeAlso = isBoth && !!course?.isInSubscription;

  const accessText = useMemo(() => {
    if (!hasAccess) return null;
    if (viaSubscription) return 'شما از طریق اشتراک به این دوره دسترسی دارید.';
    if (hasDirectCourseAccess) return 'شما هنرجوی این دوره هستید.';
    return 'شما به این دوره دسترسی دارید.';
  }, [hasAccess, viaSubscription, hasDirectCourseAccess]);

  const detailClickHandler = () => {
    router.push(`/courses/${course.shortAddress}`);
  };

  const courseClickHandler = async () => {
    try {
      setIsEnterCourseLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`
      );

      if (res.ok) {
        const { sessionId } = await res.json();
        if (sessionId) {
          router.push(`/courses/${course.shortAddress}/lesson/${sessionId}`);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsEnterCourseLoading(false);
    }
  };

  return (
    // ✅ h-full برای اینکه در لیست، کارت‌ها هم‌قد شوند
    <div
      className={`flex h-full w-full flex-col rounded-xl shadow-md ${className}`}
    >
      <div className='relative'>
        <Image
          src={course.cover}
          alt={course.title}
          className='h-32 w-full rounded-t-xl object-cover xs:h-48 lg:h-56'
          width={800}
          height={600}
        />

        {(showSubscriptionBadgeOnly || showSubscriptionBadgeAlso) && (
          <div className='absolute right-2 top-2'>
            {showSubscriptionBadgeOnly && <SubscriptionBadge type='ONLY' />}
            {showSubscriptionBadgeAlso && <SubscriptionBadge type='ALSO' />}
          </div>
        )}
      </div>

      {/* ✅ اینجا باید flex-1 داشته باشیم تا فضای باقی‌مانده رو پر کنه */}
      <div className='flex flex-1 flex-col gap-2 px-3 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2'>
        {/* ✅ محتوا: flex-1 */}
        <div className='flex-1'>
          <h2 className='mb-2 text-base font-semibold text-text-light md:text-lg dark:text-text-dark'>
            {course.title}
          </h2>
          <p className='text-2xs text-subtext-light sm:text-xs lg:text-sm dark:text-subtext-dark'>
            {course.subtitle}
          </p>

          {hasAccess && (
            <div className='mb-4 mt-4 flex gap-1 text-green-light lg:mb-5 dark:text-green-dark'>
              <GrYoga className='min-h-6 min-w-6' />
              <p className='text-sm'>{accessText}</p>
            </div>
          )}
        </div>

        {/* ✅ اکشن‌ها: mt-auto => چسبیده به پایین با حفظ padding */}
        <div className='mt-auto'>
          {hasAccess ? (
            <div className='flex w-full items-center gap-4'>
              <Button
                shadow
                className='w-full text-xs sm:text-sm md:text-base'
                isLoading={isEnterCourseLoading}
                onClick={courseClickHandler}
              >
                ورود به دوره
              </Button>

              <Link href={`/courses/${course.shortAddress}`}>
                <IconButton icon={TiInfoLarge} size={28} />
              </Link>
            </div>
          ) : (
            <>
              {!isSubscriptionOnly && (
                <Price
                  finalPrice={course.finalPrice}
                  price={course.price}
                  discount={course.discount}
                  className='mb-4 lg:mb-6'
                />
              )}

              <CardActions
                mainBtnClick={detailClickHandler}
                courseId={course.id}
                subscriptionMode={course.pricingMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
