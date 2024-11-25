'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatTime } from '@/utils/dateTimeHelper';
import { FiLock } from 'react-icons/fi';
import { HiOutlinePlayCircle } from 'react-icons/hi2';
import { AiOutlineLogin } from 'react-icons/ai';
import Modal from '../modules/Modal/Modal';
import { useRouter, usePathname } from 'next/navigation';
import { LuLogIn, LuShoppingCart } from 'react-icons/lu';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { FiCircle } from 'react-icons/fi';

const SessionRow = ({ number, session, className, courseShortAddress }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const handleSessionClick = () => {
    const { video, access } = session;

    if (video.accessLevel === 'PUBLIC' || access === video.accessLevel) {
      router.push(`/courses/${courseShortAddress}/lesson/${session.id}`);
    } else if (video.accessLevel === 'REGISTERED' && access === 'NO_ACCESS') {
      setShowRegisterModal(true);
    } else if (video.accessLevel === 'PURCHASED' && access === 'NO_ACCESS') {
      setShowAddToCartModal(true);
    }
  };

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const addToCartHandler = () => {};

  const renderIcon = () => {
    if (
      session.access === 'PUBLIC' ||
      session.access === session.video.accessLevel
    ) {
      return (
        <HiOutlinePlayCircle className='mb-1 text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-2xl dark:text-subtext-dark' />
      );
    } else if (
      session.video.accessLevel === 'REGISTERED' &&
      session.access === 'NO_ACCESS'
    ) {
      return (
        <AiOutlineLogin className='mb-1 text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-xl dark:text-subtext-dark' />
      ); // آیکون لاگین
    } else if (
      session.video.accessLevel === 'PURCHASED' &&
      session.access === 'NO_ACCESS'
    ) {
      return (
        <FiLock className='mb-1 text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-xl dark:text-subtext-dark' />
      ); // آیکون قفل
    } else {
      return (
        <HiOutlinePlayCircle className='mb-1 text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-xl dark:text-subtext-dark' />
      ); // قفل برای دسترسی‌های NO_ACCESS
    }
  };

  const renderComplete = () => {
    if (session.sessionProgress[0]) {
      return (
        <BsFillCheckCircleFill className='text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-xl dark:text-subtext-dark' />
      );
    } else {
      return (
        <FiCircle className='text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary md:text-xl dark:text-subtext-dark' />
      );
    }
  };
  return (
    <>
      <div
        className={`sm: group flex flex-col justify-between gap-3 border-b border-gray-200 py-4 sm:flex-row sm:items-center sm:gap-1 md:cursor-pointer dark:border-gray-700 ${className}`}
        onClick={() => handleSessionClick()}
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-5 w-5 items-center justify-center rounded border border-subtext-light text-subtext-light transition-all duration-200 ease-in group-hover:border-secondary group-hover:bg-secondary group-hover:text-text-dark md:h-6 md:w-6 dark:border-subtext-dark dark:text-subtext-dark'>
            <span className='pt-1 font-faNa text-xs sm:text-sm md:text-base'>
              {number}
            </span>
          </div>
          <h5 className='text-xs font-medium text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary sm:text-sm md:text-base dark:text-subtext-dark'>
            {session.name}
          </h5>
        </div>
        <div className='flex items-center justify-between gap-3 self-end'>
          <div>{renderComplete()}</div>
          <div className='flex items-center gap-2 md:gap-6'>
            <span className='font-faNa text-2xs text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary sm:text-xs md:text-sm dark:text-subtext-dark'>
              {formatTime(session.duration, 'mm:ss')}
            </span>
            {renderIcon()}
          </div>
        </div>
      </div>
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
      {showAddToCartModal && (
        <Modal
          title='خرید دوره'
          desc='برای مشاهده این جلسه ابتدا دوره را تهیه کنید. بعد از خرید شما به محتوای کامل این دوره و تمام جلسات آن دسترسی کامل دارید .'
          icon={LuShoppingCart}
          iconSize={36}
          primaryButtonClick={addToCartHandler}
          secondaryButtonClick={() => setShowAddToCartModal(false)}
          primaryButtonText='افزودن به سبد خرید'
          secondaryButtonText='لغو'
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
};

export default SessionRow;
