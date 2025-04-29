/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Button from '@/components/Ui/Button/Button';
import Image from 'next/image';
import Input from '@/components/Ui/Input/Input';

function AddUserCourseModal({ onClose, onSuccess, userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [courseId, setCourseId] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [errorMessages, setErrorMessages] = useState({
    course: '',
    paymentMethod: '',
  });
  const [courseOptions, setCourseOptions] = useState([]);
  const paymentOptions = [
    { label: 'کارت به کارت', value: 'CREDIT_CARD' },
    { label: 'آنلاین', value: 'ONLINE' },
    { label: 'رایگان', value: 'FREE' },
  ];

  const isValidInput = () => {
    let errors = {};

    if (!courseId) {
      errors.course = 'یک دوره انتخاب کنید';
    }

    if (!paymentMethod) {
      errors.paymentMethod = 'روش پرداخت را انتخاب کنید';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  // تابع دریافت دوره‌ها از API
  const fetchCourses = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!res.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await res.json();
      // تبدیل داده‌ها به فرمت مناسب برای DropDown
      const formattedOptions = data.map((course) => ({
        value: course.id,
        label: (
          <div className='flex items-center gap-2'>
            <Image
              src={course.cover} // آدرس تصویر کاور
              alt={course.title}
              width={128}
              height={96}
              className='h-9 w-12 rounded-md object-cover'
            />
            <span>{course.title}</span> {/* عنوان دوره */}
          </div>
        ),
      }));
      setCourseOptions(formattedOptions);
    } catch (error) {
      toast.error('خطا در دریافت لیست دوره‌ها');
      console.error('Error fetching courses:', error);
    }
  };

  // درخواست API پس از رندر اولیه
  useEffect(() => {
    fetchCourses();
  }, []);

  const submitUserCourse = async () => {
    if (!isValidInput()) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/course`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            courseId,
            amount: amount ? Number(amount) : 0,
            paymentMethod,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.showErrorToast(data.error);
      } else {
        toast.showSuccessToast(data.message);
        onSuccess();
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            ثبت دوره جدید
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div>
          <p className='py-4 text-sm text-subtext-light dark:text-subtext-dark'>
            دوره مورد نظر را از لیست زیر انتخاب کنید
          </p>
          <DropDown
            options={courseOptions}
            fullWidth
            placeholder='دوره مورد نظر را انتخاب کنید'
            value={courseId}
            onChange={setCourseId}
            errorMessage={errorMessages.course}
            optionClassName='max-h-52 overflow-y-auto'
            className='mt-4 bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <DropDown
              options={paymentOptions}
              fullWidth
              placeholder='نوع پرداخت را انتخاب کنید'
              value={paymentMethod}
              onChange={setPaymentMethod}
              errorMessage={errorMessages.paymentMethod}
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
            <Input
              placeholder='مبلغ پرداختی را وارد کنید'
              value={amount}
              onChange={setAmount}
              thousandSeparator={true}
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
          </div>
        </div>

        <Button
          onClick={submitUserCourse}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
        >
          ثبت دوره
        </Button>
      </div>
    </div>
  );
}

AddUserCourseModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddUserCourseModal;
