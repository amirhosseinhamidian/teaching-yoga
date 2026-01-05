'use client';
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import clsx from 'clsx';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { TbShoppingCartCog } from 'react-icons/tb';
import SearchBox from '../../modules/SearchBox/SearchBox';
import OrderDetailsModal from './OrderDetailsModal';

const purchaseTypeMeta = {
  COURSE: {
    label: 'دوره',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-300',
  },
  SUBSCRIPTION: {
    label: 'اشتراک',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-300',
  },
  SHOP: {
    label: 'فروشگاه',
    bg: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-300',
  },
  MIXED: {
    label: 'ترکیبی',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-300',
  },
  UNKNOWN: {
    label: 'نامشخص',
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-300',
  },
};

function groupItems(items = []) {
  const groups = { COURSE: [], SUBSCRIPTION: [], PRODUCT: [] };
  for (const it of items) {
    if (it?.type === 'COURSE') groups.COURSE.push(it.title);
    else if (it?.type === 'SUBSCRIPTION') groups.SUBSCRIPTION.push(it.title);
    else if (it?.type === 'PRODUCT') groups.PRODUCT.push(it.title);
  }
  return groups;
}

function renderItemsList(items = []) {
  if (!items?.length) return '—';

  const g = groupItems(items);
  const lines = [];

  if (g.SUBSCRIPTION.length) {
    lines.push(`اشتراک: ${g.SUBSCRIPTION.join('، ')}`);
  }
  if (g.COURSE.length) {
    lines.push(
      g.COURSE.length > 1
        ? `دوره‌ها: ${g.COURSE.map((t, i) => `${i + 1}. ${t}`).join('  ')}`
        : `دوره: ${g.COURSE[0]}`
    );
  }
  if (g.PRODUCT.length) {
    lines.push(
      g.PRODUCT.length > 1
        ? `محصولات: ${g.PRODUCT.map((t, i) => `${i + 1}. ${t}`).join('  ')}`
        : `محصول: ${g.PRODUCT[0]}`
    );
  }

  return (
    <div className='whitespace-pre-wrap leading-5'>{lines.join('\n')}</div>
  );
}

const SalesTable = ({
  className,
  sales,
  setSales,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onSearch,
}) => {
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [saleTemp, setSaleTemp] = useState({});
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text) => onSearch?.(text);

  const handleDetailClick = (sale) => {
    setSaleTemp(sale);
    setShowOrderDetailsModal(true);
  };

  const handleOrderDetailChanges = (id, status, method) => {
    setSales((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, method } : p))
    );
    setShowOrderDetailsModal(false);
  };

  const columns = useMemo(
    () => [
      { key: 'number', label: 'شماره' },

      {
        key: 'username',
        label: 'نام کاربری',
        render: (_, row) => (
          <div className='flex items-center justify-center gap-1'>
            <Image
              src={row?.avatar || '/images/default-profile.png'}
              alt={row.username || 'user'}
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
        minWidth: '130px',
        render: (_, row) => (
          <span>
            {row?.firstname} {row?.lastname}
          </span>
        ),
      },

      {
        key: 'purchaseType',
        label: 'نوع خرید',
        minWidth: '110px',
        render: (purchaseType) => {
          const meta =
            purchaseTypeMeta[purchaseType] || purchaseTypeMeta.UNKNOWN;
          return (
            <span
              className={clsx(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs',
                meta.bg,
                meta.text
              )}
            >
              {meta.label}
            </span>
          );
        },
      },

      {
        key: 'items',
        minWidth: '260px',
        label: 'آیتم‌ها',
        render: (items) => renderItemsList(items),
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
              bg: 'bg-green-light ',
              text: 'text-green-light dark:text-green-dark whitespace-nowrap',
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
        key: 'amountToman',
        label: 'مبلغ (تومان)',
        render: (amountToman) =>
          Number(amountToman || 0) === 0
            ? 'رایگان'
            : Number(amountToman).toLocaleString('fa-IR'),
      },

      {
        key: 'actions',
        label: 'عملیات',
        render: (_, row) => (
          <div className='flex items-center justify-center gap-2'>
            <ActionButtonIcon
              color='secondary'
              icon={TbShoppingCartCog}
              onClick={() => handleDetailClick(row)}
            />
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(
    () =>
      (sales || []).map((sale, index) => ({
        number: index + 1 + (page - 1) * 10,

        id: sale.id,
        username: sale.username,
        avatar: sale.avatar,
        firstname: sale.firstname,
        lastname: sale.lastname,
        phone: sale.phone,

        purchaseType: sale.purchaseType, // ✅ جدید
        items: sale.items || [], // ✅ جدید

        updatedAt: sale.updatedAt,
        status: sale.status,
        method: sale.method,

        amountToman: sale.amountToman, // ✅ جدید
        transactionId: sale.transactionId,
        authority: sale.authority,
        kind: sale.kind,
      })),
    [sales, page]
  );

  return (
    <div className={className}>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <h2 className='mb-5 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
          پرداخت‌ها
        </h2>

        <SearchBox
          placeholder='نام کاربری یا شماره موبایل'
          value={searchText}
          onChange={setSearchText}
          onSearch={handleSearch}
        />
      </div>

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
  onSearch: PropTypes.func,
};

export default SalesTable;
