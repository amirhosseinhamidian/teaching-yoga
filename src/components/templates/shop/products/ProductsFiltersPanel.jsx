'use client';

import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import DropDown from '@/components/Ui/DropDown/DropDwon';
import Button from '@/components/Ui/Button/Button';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Input from '@/components/Ui/Input/Input';

import { IoClose } from 'react-icons/io5';
import SearchBox from '@/app/a-panel/components/modules/SearchBox/SearchBox';
import { useUiOverlay } from '@/contexts/UiOverlayContext';

export default function ProductsFiltersPanel({
  mode,
  open,
  onClose,
  query,
  categories,
  colors,
  canPriceSort,
  sortValue,
  onSortChange,
  onApply,
  onClear,
}) {
  // local draft state برای اعمال/لغو در drawer
  const [draft, setDraft] = useState(query);
  const { setOverlayOpen } = useUiOverlay();
  useEffect(() => {
    if (mode !== 'drawer') return;
    setOverlayOpen(!!open);
    return () => setOverlayOpen(false);
  }, [open, mode, setOverlayOpen]);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  const categoryOptions = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return [
      { label: 'همه دسته‌بندی‌ها', value: '' },
      ...list.map((c) => ({ label: c.title, value: String(c.id) })),
    ];
  }, [categories]);

  const sortOptions = useMemo(() => {
    if (!canPriceSort) return [{ label: 'جدیدترین', value: 'newest' }];
    return [
      { label: 'جدیدترین', value: 'newest' },
      { label: 'گران‌ترین', value: 'price_desc' },
      { label: 'ارزان‌ترین', value: 'price_asc' },
    ];
  }, [canPriceSort]);

  const colorsList = Array.isArray(colors) ? colors : [];

  const toggleColor = (cid) => {
    setDraft((p) => {
      const exists = (p.colorIds || []).includes(cid);
      return {
        ...p,
        colorIds: exists
          ? (p.colorIds || []).filter((x) => x !== cid)
          : [...(p.colorIds || []), cid],
        page: 1,
      };
    });
  };

  const content = (
    <div className='mb-10 space-y-5 md:mb-0'>
      {/* search + sort */}
      <div className='space-y-3'>
        <SearchBox
          value={draft.search || ''}
          onChange={(v) => {
            setDraft((p) => ({ ...p, search: v, page: 1 }));
          }}
          onSearch={() => onApply({ ...draft, page: 1, _openFilters: false })}
          placeholder='جستجو در محصولات...'
          className='w-full'
          inputClassName='text-xs sm:text-sm w-full'
        />

        <DropDown
          label='مرتب‌سازی'
          options={sortOptions}
          value={sortValue || 'newest'}
          onChange={(v) => {
            onSortChange?.(v);
            setDraft((p) => ({ ...p, sort: v, page: 1 }));
          }}
          fullWidth
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        />
      </div>

      {/* category */}
      <DropDown
        label='دسته‌بندی'
        options={categoryOptions}
        value={draft.categoryId ? String(draft.categoryId) : ''}
        onChange={(val) =>
          setDraft((p) => ({
            ...p,
            categoryId: val ? Number(val) : null,
            page: 1,
          }))
        }
        fullWidth
        placeholder='همه دسته بندی ها'
        className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        optionClassName='max-h-52 overflow-y-auto custom-scrollbar'
      />

      {/* price */}
      <div className='grid grid-cols-1 gap-3 xs:grid-cols-2'>
        <Input
          label='حداقل قیمت'
          value={draft.minPrice ?? ''}
          onChange={(v) => setDraft((p) => ({ ...p, minPrice: v, page: 1 }))}
          thousandSeparator
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        />
        <Input
          label='حداکثر قیمت'
          value={draft.maxPrice ?? ''}
          onChange={(v) => setDraft((p) => ({ ...p, maxPrice: v, page: 1 }))}
          thousandSeparator
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        />
      </div>

      {/* inStock */}
      <Checkbox
        label='فقط محصولات موجود'
        checked={!!draft.inStock}
        onChange={(v) => setDraft((p) => ({ ...p, inStock: v, page: 1 }))}
        labelClass='text-sm md:text-base'
        className='my-2'
      />

      {/* colors */}
      <div>
        <h2 className='mb-2 text-sm font-semibold'>رنگ‌ها</h2>
        <div className='flex flex-wrap gap-2'>
          {colorsList.map((c) => {
            const active = (draft.colorIds || []).includes(c.id);
            return (
              <button
                key={c.id}
                type='button'
                onClick={() => toggleColor(c.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                  active
                    ? 'border-2 border-accent transition duration-150 ease-in'
                    : 'border-foreground-light bg-surface-light dark:border-foreground-dark dark:bg-surface-dark'
                }`}
              >
                <span
                  className='h-3 w-3 rounded-full border'
                  style={{ background: c.hex }}
                />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* actions */}
      <div className='flex items-center gap-2 pt-2'>
        <Button
          shadow
          className='flex-1 text-xs'
          onClick={() => onApply({ ...draft, _openFilters: false })}
        >
          اعمال فیلترها
        </Button>
        <Button className='text-xs' onClick={onClear}>
          پاک کردن
        </Button>
      </div>
    </div>
  );

  // Sidebar
  if (mode === 'sidebar') {
    return (
      <div className='sticky top-4 rounded-2xl border border-foreground-light bg-surface-light p-4 dark:border-foreground-dark dark:bg-surface-dark'>
        <h2 className='mb-4 text-sm font-semibold'>فیلترها</h2>
        {content}
      </div>
    );
  }

  // Drawer (mobile)
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50' data-bottom-sheet-open='true'>
      {/* overlay */}
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* bottom sheet */}
      <div className='absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-light p-4 dark:bg-surface-dark'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-sm font-semibold'>فیلتر و جستجو</h2>
          <button onClick={onClose} className='p-1'>
            <IoClose size={22} />
          </button>
        </div>

        {content}
      </div>
    </div>
  );
}

ProductsFiltersPanel.propTypes = {
  mode: PropTypes.oneOf(['sidebar', 'drawer']).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  query: PropTypes.object.isRequired,
  categories: PropTypes.array,
  colors: PropTypes.array,
  canPriceSort: PropTypes.bool.isRequired,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  sortValue: PropTypes.string,
  onSortChange: PropTypes.func,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
