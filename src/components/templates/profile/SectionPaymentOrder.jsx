/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Table from '@/components/Ui/Table/Table';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import clsx from 'clsx';

async function fetchUserPayment() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/payment`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch payment data: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return []; // Return an empty array on error
  }
}

const SectionPaymentOrder = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserPayment = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserPayment();
      console.log(data);
      if (data) {
        setPayments(data);
      }
    } catch (error) {
      console.error('Error in getUserPayment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getUserPayment();
  }, []);

  const columns = [
    {
      key: 'transactionId',
      label: 'شماره تراکنش',
      render: (transactionId) => (transactionId === '0' ? '-' : transactionId),
    },
    {
      key: 'courses',
      label: 'دوره‌ها',
      render: (courses) => (
        <div className='whitespace-pre-wrap'>
          {courses && courses.length > 0
            ? courses.length > 1
              ? courses
                  .map((course, index) => `${index + 1}. ${course}`)
                  .join('\n')
              : courses[0] // نمایش بدون شماره برای تنها یک دوره
            : 'نامشخص'}
        </div>
      ),
    },
    {
      key: 'updatedAt',
      label: 'تاریخ',
      render: (date) => getShamsiDate(date),
    },
    {
      key: 'status',
      label: 'وضعیت',
      render: (status) => {
        const statusMap = {
          PENDING: {
            label: 'در انتظار تکمیل',
            bg: 'bg-yellow-600',
            text: 'text-yellow-600',
          },
          SUCCESSFUL: {
            label: 'تکمیل‌شده',
            bg: 'bg-green',
            text: 'text-green',
          },
          FAILED: { label: 'ناموفق', bg: 'bg-red', text: 'text-red' },
        };
        const statusStyle = statusMap[status] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              statusStyle.bg,
              statusStyle.text,
            )}
          >
            {statusStyle.label}
          </span>
        );
      },
    },
    {
      key: 'method',
      label: 'روش پرداخت',
      render: (method) => {
        const methodMap = {
          CREDIT_CARD: {
            label: 'کارت به کارت',
            bg: 'bg-blue',
            text: 'text-blue',
          },
          FREE: {
            label: 'بدون پرداخت',
            bg: 'bg-purple-600',
            text: 'text-purple-600',
          },
          ONLINE: {
            label: 'آنلاین',
            bg: 'bg-orange-600',
            text: 'text-orange-600',
          },
        };
        const methodStyle = methodMap[method] || {
          label: 'نامشخص',
          bg: 'bg-gray-600',
          text: 'text-gray-600',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              methodStyle.bg,
              methodStyle.text,
            )}
          >
            {methodStyle.label}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: 'مبلغ (تومان)',
      render: (amount) =>
        amount === 0 ? 'رایگان' : amount.toLocaleString('fa-IR'),
    },
  ];

  return (
    <>
      {isLoading ? (
        <div className='flex h-full w-full items-center justify-center'>
          <AiOutlineLoading3Quarters
            size={46}
            className='animate-spin text-secondary'
          />
        </div>
      ) : (
        <div>
          {payments.length > 0 ? (
            <Table
              columns={columns}
              data={payments}
              className='my-6 overflow-x-auto sm:my-10 sm:max-w-[375px] md:max-w-[500px] lg:max-w-[800px] xl:max-w-[1200px]'
            />
          ) : (
            <div className='text-center text-gray-500'>
              هیچ پرداختی یافت نشد.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SectionPaymentOrder;
