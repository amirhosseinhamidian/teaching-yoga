'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';

export default function ProductsPagination({
  page,
  totalPages,
  pageSize,
  total,
  onChangePage,
  onChangePageSize,
}) {
  const pageSizeOptions = [
    { label: '20', value: 20 },
    { label: '30', value: 30 },
    { label: '40', value: 40 },
    { label: '60', value: 60 },
  ];

  if (totalPages <= 1 && (total || 0) <= (pageSize || 20)) return null;

  return (
    <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='text-xs text-subtext-light dark:text-subtext-dark'>
        {total?.toLocaleString('fa-IR')} محصول
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Button
          shadow
          className='text-xs'
          disabled={page <= 1}
          onClick={() => onChangePage(page - 1)}
        >
          قبلی
        </Button>

        <span className='font-faNa text-sm'>
          صفحه {page?.toLocaleString('fa-IR')} از{' '}
          {totalPages?.toLocaleString('fa-IR')}
        </span>

        <Button
          shadow
          className='text-xs'
          disabled={page >= totalPages}
          onClick={() => onChangePage(page + 1)}
        >
          بعدی
        </Button>

        <div className='w-24'>
          <DropDown
            label='تعداد'
            options={pageSizeOptions}
            value={pageSize}
            onChange={(v) => onChangePageSize(Number(v))}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

ProductsPagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number,
  onChangePage: PropTypes.func.isRequired,
  onChangePageSize: PropTypes.func.isRequired,
};
