'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { IoClose } from 'react-icons/io5';
import { getStringTime } from '@/utils/dateTimeHelper';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { PUBLIC, PURCHASED, REGISTERED } from '@/constants/videoAccessLevel';

const EditSessionModal = ({ onClose, session, onSuccess }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(session?.name || '');
  const [duration, setDuration] = useState(session?.duration || '');
  const [accessLevel, setAccessLevel] = useState(
    session?.video?.accessLevel || '',
  );
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    accessLevel: '',
    duration: '',
  });

  const accessVideoOptions = [
    { label: 'عمومی', value: PUBLIC },
    { label: 'ثبت نام', value: REGISTERED },
    { label: 'خریداری', value: PURCHASED },
  ];

  const validateInputs = () => {
    let errors = {};

    if (!name.trim()) {
      errors.name = 'عنوان نمی‌تواند خالی باشد.';
    }

    if (!accessLevel) {
      errors.accessLevel = 'سطح دسترسی ویدیو را مشخص کنید.';
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
      accessLevel,
      duration: Number(duration),
    };

    try {
      const response = await fetch(
        `/api/admin/terms/${session.termId}/sessions/${session.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast.showSuccessToast('جلسه با موفقیت بروزرسانی شد');
        onSuccess(data.updatedSession);
        // هرگونه عملیات اضافه دیگر مانند بستن فرم یا بازخوانی داده‌ها
      } else {
        const errorData = await response.json();
        toast.showErrorToast(errorData.error || 'خطا در بروزرسانی جلسه');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.showErrorToast('خطای غیرمنتظره‌ای رخ داده است');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            ویرایش جلسه
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
            <DropDown
              options={accessVideoOptions}
              placeholder='سطح دوره را مشخص کنید'
              value={accessLevel}
              onChange={setAccessLevel}
              errorMessage={errorMessages.accessLevel}
              className='mt-4 bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
          </div>
        </div>
        <Button
          onClick={handleFormSubmit}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
        >
          بروزرسانی
        </Button>
      </div>
    </div>
  );
};

EditSessionModal.propTypes = {
  session: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default EditSessionModal;
