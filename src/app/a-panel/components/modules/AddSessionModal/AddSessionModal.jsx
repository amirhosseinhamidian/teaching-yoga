/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { getStringTime } from '@/utils/dateTimeHelper';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';

const AddSessionModal = ({ onClose, termId, onSuccess }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    duration: '',
  });

  const validateInputs = () => {
    let errors = {};

    if (!name.trim()) {
      errors.name = 'عنوان نمی‌تواند خالی باشد.';
    }

    if (!duration || isNaN(duration) || Number(duration) <= 0) {
      errors.duration = 'مدت زمان باید یک عدد معتبر و بیشتر از صفر باشد.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }
    setIsLoading(true);
    const payload = {
      name,
      duration: Number(duration),
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termId}/sessions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        const newSession = await response.json();
        onSuccess(newSession);
        toast.showSuccessToast('جلسه با موفقیت ساخته شد');
        setName('');
        setDuration('');
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        toast.showErrorToast(errorText || 'خطای رخ داده');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            ثبت جلسه جدید
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='عنوان جلسه'
            placeholder='عنوان دوره را وارد کنید'
            value={name}
            onChange={setName}
            errorMessage={errorMessages.name}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <div>
            <Input
              label='زمان (ثانیه)'
              placeholder='مدت زمان دوره را وارد کنید (برحسب ثانیه)'
              value={duration}
              onChange={setDuration}
              errorMessage={errorMessages.duration}
              thousandSeparator={true}
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
            <p className='mr-2 mt-1 font-faNa text-green sm:text-sm'>
              {duration && getStringTime(duration)}
            </p>
          </div>
        </div>
        <Button
          onClick={handleFormSubmit}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
        >
          ثبت جلسه
        </Button>
      </div>
    </div>
  );
};

AddSessionModal.propTypes = {
  termId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddSessionModal;
