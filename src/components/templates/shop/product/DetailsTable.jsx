'use client';

import React, { useMemo } from 'react';

import PropTypes from 'prop-types';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toFaLabel(key) {
  const map = {
    weightGram: 'وزن',
  };

  return map[key] || key;
}

function formatCell(value) {
  if (value == null) {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'بله' : 'خیر';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('fa-IR');
  }

  if (typeof value === 'string') {
    const normalized = value.trim();

    return normalized || '—';
  }

  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);

      return json.length > 120 ? `${json.slice(0, 120)}…` : json;
    } catch {
      return '—';
    }
  }

  return String(value);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function DetailsTable({
  title = 'مشخصات محصول',
  details,
  weightGram,
}) {
  const detailsIsObject = isPlainObject(details);

  const detailsIsArray = Array.isArray(details);

  const hasWeight = weightGram != null && Number.isFinite(Number(weightGram));

  /*
  |--------------------------------------------------------------------------
  | Object rows
  |--------------------------------------------------------------------------
  */

  const objectRows = useMemo(() => {
    if (!detailsIsObject) {
      return [];
    }

    const rows = Object.entries(details)
      .map(([key, value]) => ({
        key,

        label: toFaLabel(key),

        value: formatCell(value),
      }))
      .filter((row) => row.value !== '—');

    if (hasWeight) {
      rows.unshift({
        key: 'weightGram',

        label: 'وزن',

        value: `${Number(weightGram).toLocaleString('fa-IR')} گرم`,
      });
    }

    return rows;
  }, [detailsIsObject, details, hasWeight, weightGram]);

  /*
  |--------------------------------------------------------------------------
  | Array rows
  |--------------------------------------------------------------------------
  */

  const arrayRows = useMemo(() => {
    if (!detailsIsArray) {
      return [];
    }

    return details.filter((item) => isPlainObject(item));
  }, [detailsIsArray, details]);

  const baseArrayColumns = useMemo(() => {
    if (!detailsIsArray) {
      return [];
    }

    const columns = new Set();

    arrayRows.forEach((row) => {
      Object.keys(row).forEach((key) => columns.add(key));
    });

    return Array.from(columns);
  }, [detailsIsArray, arrayRows]);

  const {
    columns: arrayColumns,

    rows: arrayRowsWithWeight,
  } = useMemo(() => {
    if (!detailsIsArray) {
      return {
        columns: [],
        rows: [],
      };
    }

    const columns = [...baseArrayColumns];

    const rows = arrayRows.map((row) => ({
      ...row,
    }));

    if (hasWeight) {
      const keyColumn =
        columns.find((column) => String(column).toLowerCase() === 'key') ||
        'key';

      const valueColumn =
        columns.find((column) => String(column).toLowerCase() === 'value') ||
        'value';

      if (!columns.includes(keyColumn)) {
        columns.unshift(keyColumn);
      }

      if (!columns.includes(valueColumn)) {
        const keyIndex = columns.indexOf(keyColumn);

        columns.splice(keyIndex + 1, 0, valueColumn);
      }

      const weightRow = {};

      columns.forEach((column) => {
        weightRow[column] = '';
      });

      weightRow[keyColumn] = 'وزن';

      weightRow[valueColumn] = `${Number(weightGram).toLocaleString(
        'fa-IR'
      )} گرم`;

      rows.unshift(weightRow);
    }

    return {
      columns,
      rows,
    };
  }, [detailsIsArray, baseArrayColumns, arrayRows, hasWeight, weightGram]);

  const hasAny =
    objectRows.length > 0 ||
    (arrayRowsWithWeight.length > 0 && arrayColumns.length > 0);

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='relative overflow-hidden p-5 sm:p-6 lg:p-7'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-secondary/[0.07] blur-[85px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-5 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineClipboardDocumentList size={21} />
          </span>

          <div>
            <p className='text-[10px] font-bold text-secondary'>جزئیات</p>

            <h2 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              {title}
            </h2>
          </div>
        </div>

        {!hasAny ? (
          <div className='flex min-h-[150px] flex-col items-center justify-center text-center'>
            <HiOutlineClipboardDocumentList
              size={30}
              className='text-secondary/40'
            />

            <p className='mt-3 text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
              مشخصاتی برای این محصول ثبت نشده است.
            </p>
          </div>
        ) : (
          <>
            {/* Object */}
            {objectRows.length > 0 && (
              <div className='overflow-hidden rounded-[20px] border border-black/5 dark:border-white/10'>
                <table className='w-full text-right text-xs sm:text-sm'>
                  <tbody>
                    {objectRows.map((row, index) => (
                      <tr
                        key={row.key}
                        className={`border-b border-black/5 last:border-b-0 dark:border-white/10 ${
                          index % 2 === 0
                            ? 'bg-background-light/35 dark:bg-background-dark/25'
                            : 'bg-secondary/[0.035] dark:bg-secondary/[0.055]'
                        }`}
                      >
                        <td className='w-[40%] px-3 py-3.5 text-[11px] font-bold text-subtext-light sm:px-4 sm:text-xs dark:text-subtext-dark'>
                          {row.label}
                        </td>

                        <td className='px-3 py-3.5 font-faNa text-xs font-black text-text-light sm:px-4 sm:text-sm dark:text-text-dark'>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Array */}
            {arrayColumns.length > 0 && arrayRowsWithWeight.length > 0 && (
              <div
                className={`${objectRows.length ? 'mt-4' : ''} custom-scrollbar overflow-x-auto rounded-[20px] border border-black/5 dark:border-white/10`}
              >
                <table className='min-w-full text-right text-xs sm:text-sm'>
                  <tbody>
                    {arrayRowsWithWeight.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-black/5 last:border-b-0 dark:border-white/10 ${
                          index % 2 === 0
                            ? 'bg-background-light/35 dark:bg-background-dark/25'
                            : 'bg-secondary/[0.035] dark:bg-secondary/[0.055]'
                        }`}
                      >
                        {arrayColumns.map((column) => {
                          const lower = String(column).toLowerCase();

                          const isKey = lower === 'key';

                          return (
                            <td
                              key={column}
                              className={`whitespace-nowrap px-3 py-3.5 sm:px-4 ${
                                isKey
                                  ? 'text-[11px] font-bold text-subtext-light dark:text-subtext-dark'
                                  : 'font-faNa text-xs font-black text-text-light sm:text-sm dark:text-text-dark'
                              }`}
                            >
                              {formatCell(row[column])}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </SiteCard>
  );
}

DetailsTable.propTypes = {
  title: PropTypes.string,

  details: PropTypes.any,

  weightGram: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
