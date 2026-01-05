/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { LuTrash } from 'react-icons/lu';
import SizeManageModal from './SizeManageModal';

export default function ProductSizesSection({ value, onChange }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [allSizes, setAllSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [open, setOpen] = useState(false);

  const selectedIds = useMemo(
    () => (Array.isArray(value) ? value.map((s) => s.id) : []),
    [value]
  );

  const fetchSizes = async () => {
    try {
      setLoadingSizes(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/sizes`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در دریافت لیست سایزها');
        setAllSizes([]);
        return;
      }

      const list = Array.isArray(data) ? data : data?.items || [];
      setAllSizes(list.filter((x) => x && x.id));
    } catch (e) {
      setAllSizes([]);
      toast.showErrorToast('خطا در دریافت لیست سایزها');
    } finally {
      setLoadingSizes(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  const removeSelected = (id) => {
    onChange(value.filter((x) => x.id !== id));
  };

  return (
    <div className='w-full rounded-2xl border border-accent bg-surface-light p-4 dark:bg-surface-dark'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold xs:text-base'>سایزها</h2>

        <Button shadow className='text-xs' onClick={() => setOpen(true)}>
          افزودن سایز
        </Button>
      </div>

      {value.length === 0 ? (
        <p className='mt-3 text-xs text-subtext-light dark:text-subtext-dark'>
          هنوز سایزی انتخاب نشده است.
        </p>
      ) : (
        <div className='mt-4 flex flex-wrap gap-2'>
          {value.map((s) => (
            <div
              key={s.id}
              className='flex items-center gap-2 rounded-lg bg-foreground-light px-3 py-2 text-xs dark:bg-foreground-dark'
            >
              <span className='font-faNa font-bold'>{s.name}</span>
              {!!s.slug && (
                <span className='text-2xs text-subtext-light dark:text-subtext-dark'>
                  ({s.slug})
                </span>
              )}

              <button
                type='button'
                onClick={() => removeSelected(s.id)}
                className='text-red hover:opacity-80'
                title='حذف'
              >
                <LuTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <SizeManageModal
          open={open}
          onClose={() => setOpen(false)}
          allSizes={allSizes}
          setAllSizes={setAllSizes}
          loadingSizes={loadingSizes}
          selectedIds={selectedIds}
          onConfirm={(finalSelectedIds) => {
            const selectedObjects = allSizes
              .filter((s) => finalSelectedIds.includes(s.id))
              .map((s) => ({ id: s.id, name: s.name, slug: s.slug }));

            onChange(selectedObjects);
            setOpen(false);
          }}
          onNeedRefreshSizes={fetchSizes}
        />
      )}
    </div>
  );
}

ProductSizesSection.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};
