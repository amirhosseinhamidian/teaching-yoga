/* eslint-disable no-undef */
'use client';
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import { useRouter } from 'next/navigation';
import { prizeCountdown } from '@/utils/prizeCountdown';
import Image from 'next/image';
import { GrYoga } from 'react-icons/gr';
import Button from '../Ui/Button/Button';
import Link from 'next/link';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { TiInfoLarge } from 'react-icons/ti';
import SubscriptionBadge from './SubscriptionBadge';

export default function CourseHighCard({ course }) {
  const router = useRouter();

  const [isEnterCourseLoading, setIsEnterCourseLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const isSubscriptionOnly = course?.pricingMode === 'SUBSCRIPTION_ONLY';
  const isBoth = course?.pricingMode === 'BOTH';

  // ✅ از API جدید
  const hasAccess = !!course?.hasAccess;
  const viaSubscription = !!course?.viaSubscription;
  const hasDirectCourseAccess = !!course?.hasDirectCourseAccess;

  // ✅ badge
  const showSubscriptionBadgeOnly = isSubscriptionOnly;
  const showSubscriptionBadgeAlso = isBoth && !!course?.isInSubscription;

  const accessText = useMemo(() => {
    if (!hasAccess) return null;
    if (viaSubscription) return 'شما از طریق اشتراک به این دوره دسترسی دارید.';
    if (hasDirectCourseAccess) return 'شما هنرجوی این دوره هستید.';
    // fallback: مثلا اگر بعداً دسترسی از روش دیگری اضافه شد
    return 'شما به این دوره دسترسی دارید.';
  }, [hasAccess, viaSubscription, hasDirectCourseAccess]);

  const detailCourseClickHandler = () => {
    router.push(`/courses/${course.shortAddress}`);
  };

  useEffect(() => {
    setCountdown(prizeCountdown());
    const timer = setInterval(() => setCountdown(prizeCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  const courseClickHandler = async () => {
    try {
      setIsEnterCourseLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`
      );

      if (!res.ok) return;

      const { sessionId } = await res.json();
      if (sessionId) {
        router.push(`/courses/${course.shortAddress}/lesson/${sessionId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsEnterCourseLoading(false);
    }
  };

  return (
    <div className='flex w-full flex-col-reverse rounded-xl bg-surface-light shadow-md md:flex-row dark:bg-surface-dark'>
      <div className='flex flex-1 flex-col p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h2 className='text-lg font-semibold text-text-light md:text-xl dark:text-text-dark'>
              {course.title}
            </h2>
            <p className='mt-2 text-xs text-subtext-light md:mt-4 md:text-sm dark:text-subtext-dark'>
              {course.subtitle}
            </p>
          </div>

          {/* ✅ Badge اشتراک */}
          {(showSubscriptionBadgeOnly || showSubscriptionBadgeAlso) && (
            <div className='shrink-0'>
              {showSubscriptionBadgeOnly && <SubscriptionBadge type='ONLY' />}
              {showSubscriptionBadgeAlso && <SubscriptionBadge type='ALSO' />}
            </div>
          )}
        </div>

        {hasAccess ? (
          <div className='mt-6'>
            <div className='flex items-center gap-4'>
              <Button
                shadow
                className='w-full text-xs sm:text-sm md:w-fit md:text-base'
                isLoading={isEnterCourseLoading}
                onClick={courseClickHandler}
              >
                ورود به دوره
              </Button>

              <Link href={`/courses/${course.shortAddress}`}>
                <IconButton icon={TiInfoLarge} size={28} />
              </Link>
            </div>

            <div className='mt-4 flex gap-1 text-green md:mt-8'>
              <GrYoga className='min-h-6 min-w-6' />
              <p className='text-sm'>{accessText}</p>
            </div>
          </div>
        ) : (
          <div className='mt-5 flex flex-col-reverse gap-5 md:flex-row md:justify-between'>
            <CardActions
              mainBtnClick={detailCourseClickHandler}
              courseId={course.id}
              subscriptionMode={course.pricingMode}
              // اگر CardActions نیاز داشت می‌تونی اینا رو هم پاس بدی:
              // isInSubscription={course.isInSubscription}
            />

            {/* ✅ اگر فقط اشتراک است، Price نمایش داده نشود */}
            {!isSubscriptionOnly && (
              <Price
                finalPrice={course.finalPrice}
                price={course.price}
                discount={course.discount}
              />
            )}
          </div>
        )}
      </div>

      <Image
        src={course.cover}
        alt={course.title}
        width={600}
        height={540}
        className='max-h-48 w-full rounded-t-xl object-cover xs:max-h-72 sm:h-auto md:w-1/3 md:rounded-none md:rounded-e-xl'
      />
    </div>
  );
}
