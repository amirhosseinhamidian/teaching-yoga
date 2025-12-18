'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatTime } from '@/utils/dateTimeHelper';
import { FiLock, FiCircle } from 'react-icons/fi';
import { HiOutlinePlayCircle } from 'react-icons/hi2';
import { AiOutlineLogin } from 'react-icons/ai';
import Modal from '../modules/Modal/Modal';
import { useRouter, usePathname } from 'next/navigation';
import { LuLogIn, LuShoppingCart } from 'react-icons/lu';
import { BsFillCheckCircleFill } from 'react-icons/bs';

const SessionRow = ({
  number,
  session,
  activeSessionId,
  className,
  courseShortAddress,
  hasSubscriptionAccess = false, // آیا این دوره در پلن‌های اشتراک هست؟
  isSubscriptionOnly = false, // آیا فقط از طریق اشتراک قابل دسترسی است؟
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

    // اگر کاربر به این جلسه دسترسی دارد (عمومی یا مطابق سطح دسترسی)
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
          className={`mb-1 transition-all duration-200 ease-in md:text-2xl ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    } else if (media.accessLevel === 'REGISTERED') {
      return (
        <AiOutlineLogin
          className={`mb-1 transition-all duration-200 ease-in md:text-xl ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    } else {
      return (
        <FiLock
          className={`mb-1 transition-all duration-200 ease-in md:text-xl ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    }
  };

  const renderComplete = () => {
    if (session.sessionProgress?.[0]) {
      return (
        <BsFillCheckCircleFill
          className={`transition-all duration-200 ease-in md:text-xl ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    } else {
      return (
        <FiCircle
          className={`transition-all duration-200 ease-in md:text-xl ${
            activeSessionId === session.id
              ? 'text-secondary'
              : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
          }`}
        />
      );
    }
  };

  // متن‌ها و دکمه‌های مودال دسترسی (خرید / اشتراک)
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

    // فقط خرید دوره (رفتار قدیمی)
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

  return (
    <>
      <div
        className={`sm: group flex flex-col justify-between gap-3 border-b border-gray-200 py-4 sm:flex-row sm:items-center sm:gap-1 md:cursor-pointer dark:border-gray-700 ${className}`}
        onClick={handleSessionClick}
      >
        <div className='flex items-center gap-3'>
          <div
            className={`flex h-5 w-5 items-center justify-center rounded border transition-all duration-200 ease-in md:h-6 md:w-6 ${
              activeSessionId === session.id
                ? 'border-secondary bg-secondary text-text-dark'
                : 'border-subtext-light text-subtext-light group-hover:border-secondary group-hover:bg-secondary group-hover:text-text-dark dark:border-subtext-dark dark:text-subtext-dark'
            }`}
          >
            <span className='pt-1 font-faNa text-xs sm:text-sm md:text-base'>
              {number}
            </span>
          </div>
          <h5
            className={`text-xs font-medium transition-all duration-200 ease-in sm:text-sm lg:text-base ${
              activeSessionId === session.id
                ? 'text-secondary'
                : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
            }`}
          >
            {session.name}
          </h5>
        </div>
        <div className='flex items-center justify-between gap-3 self-end'>
          <div>{renderComplete()}</div>
          <div className='flex items-center gap-2 md:gap-6'>
            <span
              className={`font-faNa text-2xs transition-all duration-200 ease-in sm:text-xs lg:text-sm ${
                activeSessionId === session.id
                  ? 'text-secondary'
                  : 'text-subtext-light group-hover:text-secondary dark:text-subtext-dark'
              }`}
            >
              {formatTime(session.duration, 'mm:ss')}
            </span>
            {renderIcon()}
          </div>
        </div>
      </div>

      {/* مودال ثبت‌نام / ورود برای جلسات REGISTERED */}
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

      {/* مودال دسترسی خرید / اشتراک برای جلسات PURCHASED */}
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
