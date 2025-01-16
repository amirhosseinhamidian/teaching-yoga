/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { IoClose } from 'react-icons/io5';
import Input from '@/components/Ui/Input/Input';
import { getStringTime } from '@/utils/dateTimeHelper';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';

const AddEditTermModal = ({ onClose, courseId, onSuccess, term }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(false);
  const [termOptions, setTermOptions] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState(null);

  // Initialize state based on whether editing an existing term or adding a new one
  const [name, setName] = useState(term?.name || '');
  const [duration, setDuration] = useState(term?.duration || '');
  const [price, setPrice] = useState(term?.price || '');
  const [discount, setDiscount] = useState(term?.discount || '');
  const [subtitle, setSubtitle] = useState(term?.subtitle || '');
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    subtitle: '',
    duration: '',
    price: '',
    discount: '',
  });

  // Fetch terms data
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms`,
        );
        if (!response.ok) throw new Error('Failed to fetch terms');
        const data = await response.json();
        const formattedOptions = data.map((term) => ({
          value: term.id,
          label:
            term.name +
            ' - ' +
            term.sessionCount +
            ' جلسه' +
            ' - ' +
            term.price.toLocaleString('fa-IR') +
            ' تومان',
        }));
        setTermOptions(formattedOptions);
      } catch (err) {
        toast.showErrorToast(err.message);
        console.error(err);
      }
    };

    fetchTerms();
  }, []);

  const validateInputs = () => {
    let errors = {};

    if (!selectedTermId) {
      if (!name.trim()) {
        errors.name = 'عنوان نمی‌تواند خالی باشد.';
      }

      if (!price || isNaN(price) || price <= 0) {
        errors.price = 'قیمت باید یک عدد معتبر و بیشتر از صفر باشد.';
      }

      if (discount && (isNaN(discount) || discount < 0 || discount > 100)) {
        errors.discount = 'تخفیف باید یک عدد بین ۰ تا ۱۰۰ باشد.';
      }

      if (subtitle.length > 100) {
        errors.subtitle = 'توضیح مختصر باید کمتر از ۱۰۰ کاراکتر باشد.';
      }

      if (!duration || isNaN(duration) || Number(duration) <= 0) {
        errors.duration = 'مدت زمان باید یک عدد معتبر و بیشتر از صفر باشد.';
      }
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const calculateFinalPrice = () => {
    const discountAmount = (price * discount) / 100; // مقدار تخفیف
    return price - discountAmount; // قیمت نهایی
  };
  const finalPrice = calculateFinalPrice();

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }
    setIsLoading(true);
    const payload = {
      name,
      subtitle,
      price: Number(price),
      discount: Number(discount),
      duration: Number(duration),
      selectedTermId, // ترم انتخاب‌شده (در صورت وجود)
    };

    let url;
    if (term) {
      url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${term.id}`; // بروزرسانی ترم موجود
    } else {
      // افزودن ترم جدید
      url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${courseId}/terms`;
    }

    const method = term ? 'PUT' : 'POST'; // استفاده از POST برای ترم جدید یا اتصال ترم انتخابی، PUT برای بروزرسانی

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
        if (!term) {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/cart`,
            {
              method: 'POST',
              body: JSON.stringify({
                courseId: courseId,
                termId: data?.term?.id || data.termId,
              }),
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
        onSuccess(data);
      } else {
        const errorText = await response.json();
        console.error('Server error response:', errorText);
        toast.showErrorToast(errorText.error || 'خطای رخ داده');
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
      <div className='relative max-h-screen w-2/3 overflow-y-auto rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
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
        {!term && (
          <div className='mt-10'>
            <p className='mb-8'>
              شما می توانید از ترم هایی که قبلا ساخته شده برای این دوره استفاده
              کنید یا ترم جدیدی بسازید.
            </p>
            <DropDown
              options={termOptions}
              placeholder='انتخاب ترم مورد نظر'
              value={selectedTermId}
              onChange={setSelectedTermId}
              fullWidth
              label='انتخاب ترم'
            />
            <div className='mt-10 border border-b border-subtext-light dark:border-subtext-dark'></div>
          </div>
        )}
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
          <Input
            label='قیمت (تومان)'
            placeholder='قیمت دوره را وارد کنید'
            value={price}
            onChange={setPrice}
            errorMessage={errorMessages.price}
            thousandSeparator={true}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <div>
            <Input
              label='تخفیف %'
              placeholder='تخفیف دوره را وارد کنید (درصد)'
              value={discount}
              onChange={setDiscount}
              errorMessage={errorMessages.discount}
              type='number'
              maxLength={2}
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
            <p className='mr-2 mt-1 font-faNa text-green sm:text-sm'>
              {price &&
                discount &&
                `قیمت نهایی: ${finalPrice.toLocaleString()} تومان`}
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
          className='mt-8 text-xs sm:text-base'
          is={isLoading}
        >
          {term ? 'بروزرسانی' : 'ثبت'}
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
