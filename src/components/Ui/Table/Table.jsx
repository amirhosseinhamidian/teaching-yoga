'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { ImSpinner2 } from 'react-icons/im';
import { PiEmpty } from 'react-icons/pi';

const Table = ({
  columns,
  data,
  className,
  loading = false,
  empty = false,
  emptyText = '',
  onClickRow,
}) => {
  return (
    <div className={`relative overflow-x-auto ${className}`}>
      {loading ? (
        <div className='z-10 flex h-56 w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark'>
          <ImSpinner2 size={42} className='animate-spin text-primary' />
        </div>
      ) : empty ? (
        <div className='z-10 flex h-56 w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark'>
          <div className='flex flex-col items-center justify-center'>
            <PiEmpty className='mb-2 text-primary' size={42} />
            {emptyText}
          </div>
        </div>
      ) : (
        <table className='min-w-full table-auto rounded-xl bg-surface-light dark:bg-surface-dark'>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className='p-2 text-center text-2xs font-medium text-secondary sm:text-xs md:text-sm'
                  style={{
                    minWidth: col.minWidth || '30px',
                    maxWidth: col.maxWidth || '300px',
                    width: col.width || 'auto',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={` ${
                  onClickRow
                    ? 'cursor-pointer transition-all duration-200 ease-in hover:text-secondary'
                    : ''
                }`}
                onClick={() => onClickRow && onClickRow(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className='p-2 text-center font-faNa text-2xs sm:text-xs md:text-sm'
                    style={{
                      minWidth: col.minWidth || '30px',
                      maxWidth: col.maxWidth || '300px',
                      width: col.width || 'auto',
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      render: PropTypes.func,
    }),
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  className: PropTypes.string,
  loading: PropTypes.bool, // پراپ برای لودینگ
  empty: PropTypes.bool, // پراپ برای نمایش نمای خالی
  emptyText: PropTypes.string,
  onClickRow: PropTypes.func, // پراپ برای کلیک روی ردیف‌ها
};

export default Table;
