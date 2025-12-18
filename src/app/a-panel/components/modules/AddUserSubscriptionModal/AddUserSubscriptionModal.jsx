/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';

function AddUserSubscriptionModal({ onClose, onSuccess, userId }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);

  const [planId, setPlanId] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const [planOptions, setPlanOptions] = useState([]);
  const [errorMessages, setErrorMessages] = useState({
    plan: '',
    paymentMethod: '',
  });

  const paymentOptions = [
    { label: 'کارت به کارت', value: 'CREDIT_CARD' },
    { label: 'آنلاین', value: 'ONLINE' },
    { label: 'رایگان', value: 'FREE' },
  ];

  const fetchPlans = async () => {
    try {
      // این route رو اگر داری استفاده کن؛ اگر نه پایین API پیشنهادی رو دادم
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/subscription/plans`,
        { method: 'GET' }
      );

      if (!res.ok) throw new Error('Failed to fetch subscription plans');
      const plans = await res.json();

      // اگر خروجی‌ات {success,data} هست اینو تغییر بده
      const list = Array.isArray(plans?.data) ? plans.data : plans;

      const formatted = (list || [])
        .filter((p) => p.isActive)
        .map((p) => ({
          value: p.id,
          label: `${p.name} - ${Number(p.finalPrice ?? p.price ?? 0).toLocaleString('fa-IR')} تومان`,
        }));

      setPlanOptions(formatted);
    } catch (err) {
      console.error(err);
      toast.showErrorToast('خطا در دریافت پلن‌های اشتراک');
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const isValidInput = () => {
    const errors = {};

    if (!planId) errors.plan = 'یک پلن انتخاب کنید';
    if (!paymentMethod) errors.paymentMethod = 'روش پرداخت را انتخاب کنید';

    setErrorMessages(errors);
    return Object.keys(errors).length === 0;
  };

  const submitUserSubscription = async () => {
    if (!isValidInput()) return;

    try {
      setIsLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            planId,
            amount: amount ? Number(amount) : 0,
            paymentMethod,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ثبت اشتراک');
        return;
      }

      toast.showSuccessToast(data?.message || 'اشتراک با موفقیت فعال شد');
      onSuccess();
    } catch (err) {
      console.error(err);
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
            فعال‌سازی دستی اشتراک
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light dark:text-subtext-dark'
            />
          </button>
        </div>

        {planOptions.length === 0 ? (
          <div className='py-6 text-sm text-red'>
            هیچ پلن اشتراک فعالی وجود ندارد. ابتدا پلن تعریف کنید.
          </div>
        ) : (
          <>
            <p className='py-4 text-sm text-subtext-light dark:text-subtext-dark'>
              پلن اشتراک را انتخاب کنید و گزارش پرداخت را ثبت کنید.
            </p>

            <DropDown
              options={planOptions}
              fullWidth
              placeholder='پلن اشتراک را انتخاب کنید'
              value={planId}
              onChange={setPlanId}
              errorMessage={errorMessages.plan}
              optionClassName='max-h-52 overflow-y-auto'
              className='mt-2 bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
            />

            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              <DropDown
                options={paymentOptions}
                fullWidth
                placeholder='نوع پرداخت را انتخاب کنید'
                value={paymentMethod}
                onChange={setPaymentMethod}
                errorMessage={errorMessages.paymentMethod}
                className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
              />

              <Input
                placeholder='مبلغ پرداختی (اختیاری)'
                value={amount}
                onChange={setAmount}
                thousandSeparator={true}
                className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
              />
            </div>

            <Button
              onClick={submitUserSubscription}
              className='mt-8 text-xs sm:text-base'
              isLoading={isLoading}
            >
              ثبت اشتراک
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

AddUserSubscriptionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddUserSubscriptionModal;
