'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useRouter, usePathname } from 'next/navigation';

import { formatTime } from '@/utils/dateTimeHelper';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import Modal from '../modules/Modal/Modal';

import { FiLock, FiCircle } from 'react-icons/fi';

import { HiOutlinePlayCircle } from 'react-icons/hi2';

import { AiOutlineLogin } from 'react-icons/ai';

import { LuLogIn, LuShoppingCart } from 'react-icons/lu';

import { BsFillCheckCircleFill } from 'react-icons/bs';

const SessionRow = ({
  number,
  session,
  activeSessionId,
  className = '',
  courseShortAddress,
  hasSubscriptionAccess = false,
  isSubscriptionOnly = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [showAccessModal, setShowAccessModal] = useState(false);

  const getMedia = () => {
    return session.type === 'VIDEO' ? session.video : session.audio;
  };

  const handleSessionClick = () => {
    const media = getMedia();

    if (!media) return;

    // اگر کاربر به این جلسه دسترسی دارد
    if (
      media.accessLevel === 'PUBLIC' ||
      session.access === media.accessLevel
    ) {
      router.push(`/courses/${courseShortAddress}/lesson/${session.id}`);
    }

    // فقط برای کاربران ثبت‌نام کرده
    else if (
      media.accessLevel === 'REGISTERED' &&
      session.access === 'NO_ACCESS'
    ) {
      setShowRegisterModal(true);
    }

    // جلسات قفل شده برای خریداران/مشترکین
    else if (
      media.accessLevel === 'PURCHASED' &&
      session.access === 'NO_ACCESS'
    ) {
      setShowAccessModal(true);
    }
  };

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  const addToCartHandler = () => {
    // TODO: لاجیک افزودن دوره به سبد خرید
    // مثلاً: dispatch(addCourseToCart(courseId))
    console.log('add course to cart (implement me)');
  };

  const goToSubscriptions = () => {
    router.push('/subscriptions');
  };

  const renderIcon = () => {
    const media = getMedia();

    if (!media) return null;

    const isAccessible =
      session.access === 'PUBLIC' || session.access === media.accessLevel;

    if (isAccessible) {
      return (
        <HiOutlinePlayCircle
          size={20}
          className={`shrink-0 transition-colors duration-200 ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover/session:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    } else if (media.accessLevel === 'REGISTERED') {
      return (
        <AiOutlineLogin
          size={18}
          className={`shrink-0 transition-colors duration-200 ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover/session:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    } else {
      return (
        <FiLock
          size={17}
          className={`shrink-0 transition-colors duration-200 ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover/session:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    }
  };

  const renderComplete = () => {
    if (session.sessionProgress?.[0]) {
      return (
        <BsFillCheckCircleFill
          size={17}
          className={`shrink-0 transition-colors duration-200 ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-secondary/70 group-hover/session:text-secondary'
          }`}
        />
      );
    } else {
      return (
        <FiCircle
          size={17}
          className={`shrink-0 transition-colors duration-200 ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light/65 group-hover/session:text-secondary dark:text-subtext-dark/65'
          }`}
        />
      );
    }
  };

  /*
   * متن‌ها و اکشن‌های مودال دسترسی.
   * منطق این بخش عمداً بدون تغییر
   * نسبت به نسخه قبلی حفظ شده است.
   */
  const accessModalConfig = (() => {
    // فقط از طریق اشتراک
    if (isSubscriptionOnly) {
      return {
        title: 'دسترسی از طریق اشتراک',

        desc: 'برای مشاهده این جلسه، لازم است یکی از پلن‌های اشتراک فعال سایت را تهیه کنید. این دوره فقط از طریق اشتراک در دسترس است.',

        primaryText: 'مشاهده پلن‌های اشتراک',

        secondaryText: 'لغو',

        primaryAction: goToSubscriptions,

        secondaryAction: () => setShowAccessModal(false),
      };
    }

    // هم خرید دوره هم اشتراک ممکن است
    if (hasSubscriptionAccess) {
      return {
        title: 'خرید دوره یا فعال‌سازی اشتراک',

        desc: 'برای مشاهده این جلسه ابتدا دوره را تهیه کنید یا یکی از پلن‌های اشتراک را فعال نمایید. با خرید اشتراک، به مجموعه‌ای از دوره‌های انتخاب‌شده دسترسی خواهید داشت.',

        primaryText: 'خرید این دوره',

        secondaryText: 'مشاهده پلن‌های اشتراک',

        primaryAction: () => {
          addToCartHandler();

          setShowAccessModal(false);
        },

        secondaryAction: () => {
          setShowAccessModal(false);

          goToSubscriptions();
        },
      };
    }

    // فقط خرید دوره
    return {
      title: 'خرید دوره',

      desc: 'برای مشاهده این جلسه ابتدا دوره را تهیه کنید. بعد از خرید، به تمام جلسات این دوره دسترسی کامل خواهید داشت.',

      primaryText: 'افزودن به سبد خرید',

      secondaryText: 'لغو',

      primaryAction: () => {
        addToCartHandler();

        setShowAccessModal(false);
      },

      secondaryAction: () => setShowAccessModal(false),
    };
  })();

  const media = getMedia();

  const isAccessible =
    media &&
    (session.access === 'PUBLIC' || session.access === media.accessLevel);

  const isActive = activeSessionId === session.id;

  return (
    <>
      <div
        onClick={handleSessionClick}
        className={`group/session relative flex cursor-pointer flex-col gap-3 rounded-[16px] border px-3 py-3 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 ${
          isActive
            ? 'border-secondary/30 bg-secondary/[0.07] shadow-[0_8px_24px_rgba(38,145,125,0.06)] dark:bg-secondary/10'
            : 'border-black/5 bg-surface-light/55 hover:border-secondary/20 hover:bg-secondary/[0.035] dark:border-white/10 dark:bg-surface-dark/45 dark:hover:bg-secondary/[0.07]'
        } ${className}`}
      >
        {isActive && (
          <span
            aria-hidden='true'
            className='absolute bottom-3 right-0 top-3 w-[3px] rounded-l-full bg-secondary'
          />
        )}

        {/* Session title */}
        <div className='flex min-w-0 items-center gap-3'>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-faNa text-[11px] font-black transition-all duration-300 ${
              isActive
                ? 'border-secondary bg-secondary text-white'
                : 'border-secondary/15 bg-secondary/5 text-secondary group-hover/session:border-secondary group-hover/session:bg-secondary group-hover/session:text-white dark:bg-secondary/10'
            }`}
          >
            {number}
          </span>

          <div className='min-w-0'>
            <h5
              className={`line-clamp-2 text-xs font-bold leading-6 transition-colors duration-200 sm:text-sm ${
                isActive
                  ? 'text-secondary'
                  : 'text-text-light group-hover/session:text-secondary dark:text-text-dark'
              }`}
            >
              {session.name}
            </h5>

            <div className='mt-1 flex items-center gap-1.5 sm:hidden'>
              {media?.accessLevel === 'PUBLIC' && (
                <SiteBadge variant='success' size='sm'>
                  رایگان
                </SiteBadge>
              )}

              {media?.accessLevel === 'REGISTERED' && !isAccessible && (
                <SiteBadge variant='neutral' size='sm'>
                  نیاز به ورود
                </SiteBadge>
              )}

              {media?.accessLevel === 'PURCHASED' && !isAccessible && (
                <SiteBadge variant='neutral' size='sm'>
                  قفل
                </SiteBadge>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className='flex shrink-0 items-center justify-between gap-3 pr-11 sm:justify-end sm:pr-0'>
          {/* Completion */}
          <span
            title={
              session.sessionProgress?.[0]
                ? 'جلسه تکمیل شده'
                : 'جلسه تکمیل نشده'
            }
            className='flex h-8 w-8 items-center justify-center rounded-xl bg-background-light/70 dark:bg-background-dark/45'
          >
            {renderComplete()}
          </span>

          {/* Duration */}
          <span
            className={`min-w-[42px] text-center font-faNa text-[10px] transition-colors duration-200 sm:text-xs ${
              isActive
                ? 'text-secondary'
                : 'text-subtext-light group-hover/session:text-secondary dark:text-subtext-dark'
            }`}
          >
            {formatTime(session.duration, 'mm:ss')}
          </span>

          {/* Access icon */}
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-300 ${
              isActive
                ? 'border-secondary/25 bg-secondary/10'
                : 'border-black/5 bg-background-light/70 group-hover/session:border-secondary/20 group-hover/session:bg-secondary/5 dark:border-white/10 dark:bg-background-dark/45'
            }`}
          >
            {renderIcon()}
          </span>
        </div>
      </div>

      {/* REGISTERED */}
      {showRegisterModal && (
        <Modal
          title='ثبت نام یا ورود به حساب کاربری'
          desc='برای مشاهده این جلسه به صورت رایگان لطفا ابتدا وارد حساب کاربری خود شوید یا ثبت نام کنید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowRegisterModal(false)}
          primaryButtonText='ورود | ثبت نام'
          secondaryButtonText='لغو'
        />
      )}

      {/* PURCHASED */}
      {showAccessModal && (
        <Modal
          title={accessModalConfig.title}
          desc={accessModalConfig.desc}
          icon={LuShoppingCart}
          iconSize={36}
          primaryButtonClick={accessModalConfig.primaryAction}
          secondaryButtonClick={accessModalConfig.secondaryAction}
          primaryButtonText={accessModalConfig.primaryText}
          secondaryButtonText={accessModalConfig.secondaryText}
        />
      )}
    </>
  );
};

SessionRow.propTypes = {
  number: PropTypes.number.isRequired,

  session: PropTypes.object.isRequired,

  courseShortAddress: PropTypes.string.isRequired,

  className: PropTypes.string,

  activeSessionId: PropTypes.string,

  hasSubscriptionAccess: PropTypes.bool,

  isSubscriptionOnly: PropTypes.bool,
};

export default SessionRow;
