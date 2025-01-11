/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import Button from '@/components/Ui/Button/Button';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { ImSpinner2 } from 'react-icons/im';

function OrderDetailsModal({ onClose, sale, onChangeSuccess }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const paymentStatusOptions = [
    { label: 'پرداخت موفق', value: 'SUCCESSFUL' },
    { label: 'در انتظار پرداخت', value: 'PENDING' },
    { label: 'پرداخت ناموفق', value: 'FAILED' },
  ];
  const paymentMethodOptions = [
    { label: 'کارت به کارت', value: 'CREDIT_CARD' },
    { label: 'آنلاین', value: 'ONLINE' },
    { label: 'رایگان', value: 'FREE' },
  ];
  const [paymentStatus, setPaymentStatus] = useState(sale.status);
  const [paymentMethod, setPaymentMethod] = useState(sale.method);
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleUpdatePayment = async () => {
    if (paymentMethod !== sale.method || paymentStatus !== sale.status) {
      try {
        setUpdateLoading(true);
        const paymentData = {
          id: sale.id,
          status: paymentStatus,
          method: paymentMethod,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sales`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          },
        );

        if (!response.ok) {
          throw new Error('Failed to update payment.');
        }
        toast.showSuccessToast('تغییرات با موفقیت انجام شد.');
        onChangeSuccess(sale.id, paymentStatus, paymentMethod);
      } catch (error) {
        console.error('Error updating payment:', error);
        toast.showErrorToast('خطا در انجام تغییرات.');
      } finally {
        setUpdateLoading(false);
      }
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative mx-5 max-h-screen w-full overflow-y-auto rounded-xl bg-surface-light p-6 sm:mx-0 sm:w-2/3 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            جزییات سفارش
          </h3>
          <button onClick={onClose}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div>
          <table className='w-full text-right font-faNa text-xs xs:text-sm sm:text-base'>
            <tbody>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>دوره</th>
                <td className='py-2'>
                  <ul className='list-inside list-decimal'>
                    {sale.courses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>نام کاربری</th>
                <td className='py-2'>{sale.username}</td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>نام و نام خانوادگی</th>
                <td className='py-2'>{`${sale.firstname} ${sale.lastname}`}</td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>تاریخ ثبت سفارش</th>
                <td className='py-2'>{`${getTimeFromDate(sale.updatedAt)} - ${getShamsiDate(sale.updatedAt)}`}</td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>موبایل</th>
                <td className='py-2'>{sale.phone}</td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>شناسه پرداخت</th>
                <td className='py-2'>{sale.transactionId}</td>
              </tr>
              <tr className='border-b border-gray-300 dark:border-gray-600'>
                <th className='py-2 pl-2 text-secondary'>وضعیت پرداخت</th>
                <SimpleDropdown
                  className='py-2'
                  options={paymentStatusOptions}
                  onChange={setPaymentStatus}
                  value={paymentStatus}
                />
              </tr>
              <tr>
                <th className='py-2 pl-2 text-secondary'>نوع پرداخت</th>
                <SimpleDropdown
                  className='py-2'
                  options={paymentMethodOptions}
                  onChange={setPaymentMethod}
                  value={paymentMethod}
                />
              </tr>
            </tbody>
          </table>
          <div className='flex items-center justify-center'>
            <Button
              shadow
              className='mt-6 flex w-full items-center justify-center gap-2 sm:w-1/3'
              disable={updateLoading}
              onClick={handleUpdatePayment}
            >
              ثبت تغییرات
              {updateLoading && <ImSpinner2 className='animate-spin' />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

OrderDetailsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onChangeSuccess: PropTypes.func.isRequired,
  sale: PropTypes.object.isRequired,
};

export default OrderDetailsModal;
