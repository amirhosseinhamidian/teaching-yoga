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
        cache: 'no-store',
        method: 'GET',
      }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch payment data: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

const purchaseTypeMap = {
  COURSE: {
    label: 'دوره',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600 whitespace-nowrap',
  },
  SUBSCRIPTION: {
    label: 'اشتراک',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600 whitespace-nowrap',
  },
  SHOP: {
    label: 'فروشگاه',
    bg: 'bg-sky-500',
    text: 'text-sky-600 whitespace-nowrap',
  },
  MIXED: {
    label: 'ترکیبی',
    bg: 'bg-purple-500',
    text: 'text-purple-600 whitespace-nowrap',
  },
  UNKNOWN: {
    label: 'نامشخص',
    bg: 'bg-gray-500',
    text: 'text-gray-600 whitespace-nowrap',
  },
};

function groupItems(items = []) {
  const g = { SUBSCRIPTION: [], COURSE: [], PRODUCT: [] };
  for (const it of items || []) {
    const title = it?.title || '—';
    if (it?.type === 'SUBSCRIPTION') g.SUBSCRIPTION.push(title);
    else if (it?.type === 'COURSE') g.COURSE.push(title);
    else if (it?.type === 'PRODUCT') g.PRODUCT.push(title);
  }
  return g;
}

function renderItems(items = []) {
  if (!items?.length) return 'نامشخص';

  const g = groupItems(items);
  const lines = [];

  if (g.SUBSCRIPTION.length) {
    lines.push(`اشتراک: ${g.SUBSCRIPTION.join('، ')}`);
  }

  if (g.COURSE.length) {
    lines.push(
      g.COURSE.length > 1
        ? `دوره‌ها:\n${g.COURSE.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        : `دوره: ${g.COURSE[0]}`
    );
  }

  if (g.PRODUCT.length) {
    lines.push(
      g.PRODUCT.length > 1
        ? `محصولات:\n${g.PRODUCT.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        : `محصول: ${g.PRODUCT[0]}`
    );
  }

  return <div className='whitespace-pre-wrap'>{lines.join('\n')}</div>;
}

const SectionPaymentOrder = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserPayment = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserPayment();
      setPayments(Array.isArray(data) ? data : []);
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
      key: 'purchaseType',
      label: 'نوع خرید',
      minWidth: '120px',
      render: (purchaseType) => {
        const s = purchaseTypeMap[purchaseType] || purchaseTypeMap.UNKNOWN;
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              s.bg,
              s.text
            )}
          >
            {s.label}
          </span>
        );
      },
    },
    {
      key: 'items',
      label: 'آیتم‌ها',
      minWidth: '220px',
      render: (items) => renderItems(items),
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
            bg: 'bg-secondary',
            text: 'text-secondary whitespace-nowrap',
          },
          SUCCESSFUL: {
            label: 'تکمیل‌شده',
            bg: 'bg-green-light',
            text: 'text-accent text-green-light dark:text-green-dark dark:text-accent whitespace-nowrap',
          },
          FAILED: {
            label: 'ناموفق',
            bg: 'bg-red',
            text: 'text-red whitespace-nowrap',
          },
        };
        const s = statusMap[status] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600 whitespace-nowrap',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              s.bg,
              s.text
            )}
          >
            {s.label}
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
            text: 'text-blue whitespace-nowrap',
          },
          FREE: {
            label: 'بدون پرداخت',
            bg: 'bg-purple-600',
            text: 'text-purple-600 whitespace-nowrap',
          },
          ONLINE: {
            label: 'آنلاین',
            bg: 'bg-orange-600',
            text: 'text-orange-600 whitespace-nowrap',
          },
        };
        const s = methodMap[method] || {
          label: 'نامشخص',
          bg: 'bg-gray-600',
          text: 'text-gray-600 whitespace-nowrap',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              s.bg,
              s.text
            )}
          >
            {s.label}
          </span>
        );
      },
    },
    {
      key: 'amountToman',
      label: 'مبلغ (تومان)',
      render: (amountToman) => {
        const n = Number(amountToman || 0);
        return n === 0 ? 'رایگان' : n.toLocaleString('fa-IR');
      },
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
