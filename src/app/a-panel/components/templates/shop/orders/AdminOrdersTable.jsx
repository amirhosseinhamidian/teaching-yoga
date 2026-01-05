/* eslint-disable no-undef */
'use client';

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuEye } from 'react-icons/lu';
import { useRouter } from 'next/navigation';

const formatToman = (n) => `${Number(n || 0).toLocaleString('fa-IR')} تومان`;

const formatDateFa = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const humanizeStatus = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';
    case 'PROCESSING':
      return 'در حال پردازش';
    case 'PACKED':
      return 'بسته‌بندی';
    case 'SHIPPED':
      return 'ارسال‌شده';
    case 'DELIVERED':
      return 'تحویل‌شده';
    case 'CANCELLED':
      return 'لغو شده';
    case 'RETURNED':
      return 'مرجوعی';
    default:
      return s || '—';
  }
};

const humanizePayment = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'SUCCESSFUL':
      return 'موفق';
    case 'FAILED':
      return 'ناموفق';
    case 'PENDING':
      return 'در انتظار';
    default:
      return s || '—';
  }
};

const humanizeShippingMethod = (m) => {
  const v = String(m || '').toUpperCase();
  if (v === 'POST') return 'پست';
  if (v === 'COURIER_COD') return 'پیک (پرداخت در محل)';
  return m || '—';
};

// ✅ Badge styles
const statusBadgeClass = (status) => {
  const s = String(status || '').toUpperCase();

  // رنگ‌ها: (bg + text + ring) هم لایت هم دارک
  if (s === 'PENDING_PAYMENT')
    return 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/30';

  if (s === 'PROCESSING')
    return 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30';

  if (s === 'PACKED')
    return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30';

  if (s === 'SHIPPED')
    return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30';

  if (s === 'DELIVERED')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';

  if (s === 'CANCELLED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';

  if (s === 'RETURNED')
    return 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/30';

  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
};

const paymentBadgeClass = (paymentStatus) => {
  const s = String(paymentStatus || '').toUpperCase();

  if (s === 'SUCCESSFUL')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';

  if (s === 'FAILED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';

  if (s === 'PENDING')
    return 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-500/30';

  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
};

const Badge = ({ className = '', children }) => (
  <span
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-2xl px-2.5 py-1 text-2xs font-medium ring-1 md:text-xs ${className}`}
  >
    {children}
  </span>
);

Badge.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const AdminOrdersTable = ({
  className,
  orders,
  page,
  totalPages,
  pageSize,
  isLoading,
  onPageChange,
}) => {
  const router = useRouter();

  const columns = useMemo(
    () => [
      { key: 'number', label: 'شماره' },

      {
        key: 'createdAt',
        minWidth: '100px',
        label: 'تاریخ',
        render: (_, row) => (
          <span className='font-faNa'>{formatDateFa(row.createdAt)}</span>
        ),
      },

      {
        key: 'customer',
        label: 'گیرنده',
        minWidth: '160px',
        render: (_, row) => (
          <div className='flex flex-col items-center justify-center gap-0.5'>
            <span className='text-xs md:text-sm'>{row.fullName || '—'}</span>
            <span className='font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
              {row.phone || '—'}
            </span>
          </div>
        ),
      },

      {
        key: 'city',
        label: 'شهر',
        render: (_, row) => (
          <span className='text-xs'>
            {row.province
              ? `${row.province}، ${row.city || ''}`
              : row.city || '—'}
          </span>
        ),
      },

      {
        key: 'status',
        label: 'وضعیت سفارش',
        render: (_, row) => (
          <Badge className={statusBadgeClass(row.status)}>
            {humanizeStatus(row.status)}
          </Badge>
        ),
      },

      {
        key: 'paymentStatus',
        label: 'پرداخت',
        render: (_, row) => (
          <Badge className={paymentBadgeClass(row.paymentStatus)}>
            {humanizePayment(row.paymentStatus)}
          </Badge>
        ),
      },

      {
        key: 'amount',
        label: 'مبلغ',
        render: (_, row) => (
          <span className='font-faNa text-xs'>
            {formatToman(row.payableOnline)}
          </span>
        ),
      },

      {
        key: 'shipping',
        label: 'ارسال',
        minWidth: '160px',
        render: (_, row) => {
          const isPost = row.shippingMethod === 'POST';
          const needsCalc =
            row.postOptionKey === 'FALLBACK_POST_FAST' &&
            row.shippingCost === 0;

          const shippingText = isPost
            ? needsCalc
              ? 'هزینه ارسال باید محاسبه شود.'
              : row.shippingCost === 0
                ? 'رایگان'
                : formatToman(row.shippingCost)
            : 'در محل';

          return (
            <div className='flex flex-col items-center justify-center gap-0.5 text-xs'>
              <span>
                {row.shippingTitle ||
                  humanizeShippingMethod(row.shippingMethod)}
              </span>
              <span
                className={`font-faNa text-[11px] ${
                  needsCalc
                    ? 'text-red'
                    : 'text-subtext-light dark:text-subtext-dark'
                }`}
              >
                {shippingText}
              </span>
            </div>
          );
        },
      },

      {
        key: 'tracking',
        label: 'کد رهگیری',
        render: (_, row) => (
          <span className='font-faNa text-xs'>{row.trackingCode || '—'}</span>
        ),
      },

      {
        key: 'itemsCount',
        label: 'اقلام',
        render: (_, row) => (
          <span className='font-faNa text-xs'>
            {Number(row.itemsCount || 0).toLocaleString('fa-IR')}
          </span>
        ),
      },

      {
        key: 'actions',
        label: 'عملیات',
        render: (_, row) => (
          <div className='flex items-center justify-center gap-2'>
            <ActionButtonIcon
              color='secondary'
              icon={LuEye}
              onClick={() => router.push(`/a-panel/shop/orders/${row.id}`)}
            />
          </div>
        ),
      },
    ],
    [router]
  );

  const data = useMemo(() => {
    const ps = Number(pageSize || 10);
    return (orders || []).map((o, index) => ({
      number: index + 1 + (page - 1) * ps,
      id: o.id,
      createdAt: o.createdAt,
      fullName: o.fullName,
      phone: o.phone,
      province: o.province,
      city: o.city,
      status: o.status,
      paymentStatus: o.paymentStatus,
      payableOnline: o.payableOnline,
      shippingTitle: o.shippingTitle,
      shippingCost: o.shippingCost,
      shippingMethod: o.shippingMethod,
      trackingCode: o.trackingCode,
      postOptionKey: o.postOptionKey,
      itemsCount: o?._count?.items ?? o.itemsCount ?? 0,
    }));
  }, [orders, page, pageSize]);

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-8'
        loading={isLoading}
      />

      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        totalPages={totalPages}
      />
    </div>
  );
};

AdminOrdersTable.propTypes = {
  className: PropTypes.string,
  orders: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  pageSize: PropTypes.number,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default AdminOrdersTable;
