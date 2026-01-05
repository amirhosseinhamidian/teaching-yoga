// components/templates/shop/product/DetailsTable.jsx
'use client';

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

function toFaLabel(key) {
  const map = {
    weightGram: 'وزن',
  };
  return map[key] || key;
}

function formatCell(val) {
  if (val == null) return '—';
  if (typeof val === 'boolean') return val ? 'بله' : 'خیر';
  if (typeof val === 'number') return val.toLocaleString('fa-IR');

  if (typeof val === 'string') {
    const s = val.trim();
    return s ? s : '—';
  }

  if (typeof val === 'object') {
    try {
      const json = JSON.stringify(val);
      return json.length > 120 ? json.slice(0, 120) + '…' : json;
    } catch {
      return '—';
    }
  }

  return String(val);
}

function isPlainObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

export default function DetailsTable({
  title = 'مشخصات',
  details,
  weightGram,
}) {
  const detailsIsObject = isPlainObject(details);
  const detailsIsArray = Array.isArray(details);

  const hasWeight = weightGram != null && Number.isFinite(Number(weightGram));

  /* ---------- حالت آبجکت key/value ---------- */
  const objectRows = useMemo(() => {
    if (!detailsIsObject) return [];

    const rows = Object.entries(details)
      .map(([k, v]) => ({
        key: k,
        label: toFaLabel(k),
        value: formatCell(v),
      }))
      .filter((r) => r.value !== '—');

    if (hasWeight) {
      rows.unshift({
        key: 'weightGram',
        label: 'وزن',
        value: `${Number(weightGram).toLocaleString('fa-IR')} گرم`,
      });
    }

    return rows;
  }, [detailsIsObject, details, hasWeight, weightGram]);

  /* ---------- حالت آرایه‌ای از آبجکت‌ها ---------- */
  const arrayRows = useMemo(() => {
    if (!detailsIsArray) return [];
    return details.filter((x) => isPlainObject(x));
  }, [detailsIsArray, details]);

  const arrayColumns = useMemo(() => {
    if (!detailsIsArray) return [];
    const set = new Set();
    arrayRows.forEach((row) => Object.keys(row).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [detailsIsArray, arrayRows]);

  const arrayRowsWithWeight = useMemo(() => {
    if (!detailsIsArray) return [];

    const rows = [...arrayRows];

    if (hasWeight) {
      // تلاش می‌کنیم ستون‌های key/value رو پیدا کنیم (با هر نامی که در دیتا هست)
      const keyCol =
        arrayColumns.find((c) => String(c).toLowerCase() === 'key') || 'key';
      const valueCol =
        arrayColumns.find((c) => String(c).toLowerCase() === 'value') ||
        'value';

      // اگر key/value توی ستون‌ها نبود، به ستون‌ها اضافه‌شون می‌کنیم
      if (!arrayColumns.includes(keyCol)) arrayColumns.unshift(keyCol);
      if (!arrayColumns.includes(valueCol)) {
        const keyIndex = arrayColumns.indexOf(keyCol);
        arrayColumns.splice(keyIndex + 1, 0, valueCol);
      }

      const row = {};
      row[keyCol] = 'وزن';
      row[valueCol] = `${Number(weightGram).toLocaleString('fa-IR')} گرم`;

      // بقیه ستون‌ها خالی
      arrayColumns.forEach((c) => {
        if (c !== keyCol && c !== valueCol) row[c] = '';
      });

      rows.unshift(row);
    }
    return rows;
  }, [detailsIsArray, arrayRows, hasWeight, weightGram, arrayColumns]);

  const hasAny =
    objectRows.length > 0 ||
    (arrayRowsWithWeight.length > 0 && arrayColumns.length > 0);

  if (!hasAny) {
    return (
      <div>
        <div className='mb-2 text-sm font-semibold'>{title}</div>
        <p className='text-sm text-subtext-light dark:text-subtext-dark'>
          مشخصاتی برای این محصول ثبت نشده است.
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-2xl border border-foreground-light bg-surface-light p-4 dark:border-foreground-dark dark:bg-surface-dark'>
      {/* عنوان باکس */}
      <div className='mb-2 text-sm font-semibold'>{title}</div>

      {/* ---------- جدول key/value ---------- */}
      {objectRows.length > 0 && (
        <div className='overflow-hidden'>
          <table className='w-full text-sm'>
            <tbody>
              {objectRows.map((row, idx) => (
                <tr
                  key={row.key}
                  className={
                    idx % 2 === 0
                      ? 'bg-surface-light dark:bg-surface-dark'
                      : 'bg-foreground-light/60 dark:bg-foreground-dark/60'
                  }
                >
                  <td className='w-[40%] px-4 py-3 text-xs font-semibold text-subtext-light dark:text-subtext-dark'>
                    {row.label}
                  </td>
                  <td className='px-4 py-3 font-faNa font-bold text-text-light dark:text-text-dark'>
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- جدول آرایه‌ای (بدون سرستون) ---------- */}
      {arrayColumns.length > 0 && arrayRowsWithWeight.length > 0 && (
        <div className='mt-4 overflow-hidden'>
          <table className='w-full text-sm'>
            <tbody>
              {arrayRowsWithWeight.map((row, idx) => (
                <tr
                  key={idx}
                  className={
                    idx % 2 === 0
                      ? 'bg-surface-light dark:bg-surface-dark'
                      : 'bg-foreground-light/40 dark:bg-foreground-dark/40'
                  }
                >
                  {arrayColumns.map((col) => {
                    const lower = String(col).toLowerCase();
                    const isKeyCol = lower === 'key';
                    const isValueCol = lower === 'value';

                    return (
                      <td
                        key={col}
                        className={`px-4 py-3 text-text-light dark:text-text-dark ${
                          isKeyCol
                            ? 'font-faNa text-xs font-normal text-subtext-light dark:text-subtext-dark'
                            : isValueCol
                              ? 'font-faNa font-bold'
                              : 'font-faNa font-bold'
                        }`}
                      >
                        {formatCell(row[col])}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

DetailsTable.propTypes = {
  title: PropTypes.string,
  details: PropTypes.any,
  weightGram: PropTypes.number,
};
