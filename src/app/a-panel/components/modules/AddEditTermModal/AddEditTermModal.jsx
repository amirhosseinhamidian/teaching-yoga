'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { IoClose } from 'react-icons/io5';
import Input from '@/components/Ui/Input/Input';
import { getStringTime } from '@/utils/dateTimeHelper';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const AddEditTermModal = ({ onClose, courseId, onSuccess, term }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state based on whether editing an existing term or adding a new one
  const [name, setName] = useState(term?.name || '');
  const [duration, setDuration] = useState(term?.duration || '');
  const [subtitle, setSubtitle] = useState(term?.subtitle || '');
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    subtitle: '',
    duration: '',
  });

  const validateInputs = () => {
    let errors = {};

    if (!name.trim()) {
      errors.name = 'عنوان نمی‌تواند خالی باشد.';
    }

    if (subtitle.length > 100) {
      errors.subtitle = 'توضیح مختصر باید کمتر از ۱۰۰ کاراکتر باشد.';
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
      subtitle,
      duration: Number(duration),
    };

    const url = term
      ? `http://localhost:3000/api/admin/terms/${term.id}` // Update existing term
      : `http://localhost:3000/api/admin/courses/${courseId}/terms`; // Add new term

    const method = term ? 'PUT' : 'POST'; // Use PUT for updates, POST for new

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.showSuccessToast(
          term ? 'ترم با موفقیت بروزرسانی شد' : 'ترم با موفقیت ساخته شد',
        );
        onSuccess(data);
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
            {term ? 'ویرایش ترم' : 'افزودن ترم'}
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
            label='عنوان ترم'
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
          <div className='col-span-1 sm:col-span-2'>
            <Input
              label='توضیح مختصر'
              placeholder='توضیح مختصر در حد یک خط برای کارت ها'
              value={subtitle}
              onChange={setSubtitle}
              errorMessage={errorMessages.subtitle}
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
          </div>
        </div>
        <Button
          onClick={handleFormSubmit}
          className='mt-8 flex items-center justify-center text-xs sm:text-base'
          disable={isLoading}
        >
          {term ? 'بروزرسانی' : 'ثبت'}
          {isLoading && (
            <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
          )}
        </Button>
      </div>
    </div>
  );
};

AddEditTermModal.propTypes = {
  term: PropTypes.object,
  courseId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddEditTermModal;
