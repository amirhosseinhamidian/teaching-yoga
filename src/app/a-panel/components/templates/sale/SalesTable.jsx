'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import clsx from 'clsx';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { TbShoppingCartCog } from 'react-icons/tb';
import OrderDetailsModal from './OrderDetailsModal';

const SalesTable = ({
  className,
  sales,
  setSales,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [saleTemp, setSaleTemp] = useState({});

  const handleDetailClick = (sale) => {
    setSaleTemp(sale);
    setShowOrderDetailsModal(true);
  };

  const handleOrderDetailChanges = (id, status, method) => {
    setSales((prevSales) => {
      return prevSales.map((sale) => {
        if (sale.id === id) {
          return {
            ...sale,
            status: status,
            method: method,
          };
        }
        return sale;
      });
    });
    setShowOrderDetailsModal(false);
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'username',
      label: 'نام کاربری',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-1'>
          <Image
            src={row?.avatar || '/images/default-profile.png'}
            alt={row.username}
            className='h-8 w-8 rounded-full object-cover'
            width={64}
            height={64}
          />
          <p>{row.username}</p>
        </div>
      ),
    },
    {
      key: 'fullname',
      label: 'نام و نام خانوادگی',
      render: (_, row) => (
        <span>
          {row?.firstname} {row?.lastname}
        </span>
      ),
    },
    {
      key: 'courses',
      label: 'دوره‌ها',
      render: (courses) => (
        <div className='whitespace-pre-wrap text-sm'>
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
            bg: 'bg-secondary',
            text: 'text-secondary text-xs whitespace-nowrap',
          },
          SUCCESSFUL: {
            label: 'تکمیل‌شده',
            bg: 'bg-green',
            text: 'text-green dark:text-accent text-xs whitespace-nowrap',
          },
          FAILED: {
            label: 'ناموفق',
            bg: 'bg-red',
            text: 'text-red text-xs whitespace-nowrap',
          },
        };
        const statusStyle = statusMap[status] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600 text-xs whitespace-nowrap',
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
      key: 'amount',
      label: 'مبلغ (تومان)',
      render: (amount) =>
        amount === 0 ? 'رایگان' : amount.toLocaleString('fa-IR'),
    },
    {
      key: 'actions',
      label: 'عملیات',
      // eslint-disable-next-line no-unused-vars
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='accent'
            icon={TbShoppingCartCog}
            onClick={() => handleDetailClick(row)}
          />
        </div>
      ),
    },
  ];

  const data = sales.map((sale, index) => ({
    number: index + 1 + (page - 1) * 10,
    username: sale.username,
    courses: sale.courses,
    firstname: sale.firstname,
    lastname: sale.lastname,
    avatar: sale.avatar,
    updatedAt: sale.updatedAt,
    status: sale.status,
    method: sale.method,
    amount: sale.amount,
    id: sale.id,
    phone: sale.phone,
    transactionId: sale.transactionId,
  }));

  return (
    <div className={className}>
      <h2 className='mb-5 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
        آخرین سفارشات
      </h2>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={isLoading}
      />
      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        totalPages={totalPages}
      />
      {showOrderDetailsModal && (
        <OrderDetailsModal
          onClose={() => {
            setShowOrderDetailsModal(false);
            setSaleTemp({});
          }}
          sale={saleTemp}
          onChangeSuccess={(id, status, method) =>
            handleOrderDetailChanges(id, status, method)
          }
        />
      )}
    </div>
  );
};

SalesTable.propTypes = {
  className: PropTypes.string,
  sales: PropTypes.array.isRequired,
  setSales: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default SalesTable;
