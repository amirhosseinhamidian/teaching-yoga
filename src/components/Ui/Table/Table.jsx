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
        <table className='min-w-full rounded-xl bg-surface-light dark:bg-surface-dark'>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className='min-w-6 p-4 text-center text-xs font-medium text-secondary sm:text-sm'
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className='min-w-[180px] px-4 py-2 text-center font-faNa text-xs last:pb-6 sm:text-sm md:min-w-[150px] xl:min-w-[100px]'
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
};

export default Table;
