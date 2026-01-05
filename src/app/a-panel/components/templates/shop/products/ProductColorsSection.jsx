/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { FiPlus } from 'react-icons/fi';
import { LuTrash } from 'react-icons/lu';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import ColorManageModal from './ColorManageModal';

function normalizeHex(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  return s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;
}

function isValidHex(hex) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

export default function ProductColorsSection({
  value, // selected colors [{id,name,hex}]
  onChange, // set selected colors
}) {
  console.log(value);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [allColors, setAllColors] = useState([]);
  const [loadingColors, setLoadingColors] = useState(false);

  const [open, setOpen] = useState(false);

  const selectedIds = useMemo(() => value.map((c) => c.id), [value]);

  const fetchColors = async () => {
    try {
      setLoadingColors(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/colors`,
        { cache: 'no-store' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در دریافت لیست رنگ‌ها');
        setAllColors([]);
        return;
      }
      const list = Array.isArray(data) ? data : data?.items || [];
      setAllColors(list);
    } catch (e) {
      setAllColors([]);
      toast.showErrorToast('خطا در دریافت لیست رنگ‌ها');
    } finally {
      setLoadingColors(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  const removeSelected = (id) => {
    onChange(value.filter((x) => x.id !== id));
  };

  return (
    <div className='w-full rounded-2xl border border-accent bg-surface-light p-4 dark:bg-surface-dark'>
      <div className='flex items-center justify-between gap-2'>
        <h2 className='text-sm font-semibold xs:text-base'>رنگ‌ها</h2>

        <Button shadow className='text-xs' onClick={() => setOpen(true)}>
          افزودن رنگ‌
        </Button>
      </div>

      {value.length === 0 ? (
        <p className='mt-3 text-xs text-subtext-light dark:text-subtext-dark'>
          هنوز رنگی انتخاب نشده است.
        </p>
      ) : (
        <div className='mt-4 flex flex-wrap gap-2'>
          {value.map((c) => (
            <div
              key={c.id}
              className='flex items-center gap-2 rounded-lg bg-foreground-light px-3 py-2 text-xs dark:bg-foreground-dark'
            >
              <span
                className='h-3 w-3 rounded-full border border-subtext-light dark:border-subtext-dark'
                style={{
                  backgroundColor: isValidHex(normalizeHex(c.hex))
                    ? normalizeHex(c.hex)
                    : '#000',
                }}
                title={c.hex}
              />
              <span>{c.name}</span>

              <button
                type='button'
                onClick={() => removeSelected(c.id)}
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
        <ColorManageModal
          open={open}
          onClose={() => setOpen(false)}
          allColors={allColors}
          setAllColors={setAllColors}
          loadingColors={loadingColors}
          selectedIds={selectedIds}
          onConfirm={(finalSelectedIds) => {
            // ids => objects
            const selectedObjects = allColors
              .filter((c) => finalSelectedIds.includes(c.id))
              .map((c) => ({ id: c.id, name: c.name, hex: c.hex }));

            onChange(selectedObjects);
            setOpen(false);
          }}
          onNeedRefreshColors={fetchColors}
        />
      )}
    </div>
  );
}

ProductColorsSection.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      hex: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};
