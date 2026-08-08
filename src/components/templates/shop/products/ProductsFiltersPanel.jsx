'use client';

import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import DropDown from '@/components/Ui/DropDown/DropDwon';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Input from '@/components/Ui/Input/Input';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineMagnifyingGlass,
  HiOutlineSwatch,
  HiOutlineXMark,
} from 'react-icons/hi2';

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
  const [draft, setDraft] = useState(query);

  const { setOverlayOpen } = useUiOverlay();

  /*
  |--------------------------------------------------------------------------
  | Overlay
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (mode !== 'drawer') {
      return undefined;
    }

    setOverlayOpen(Boolean(open));

    return () => setOverlayOpen(false);
  }, [open, mode, setOverlayOpen]);

  /*
  |--------------------------------------------------------------------------
  | Sync
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setDraft(query);
  }, [query]);

  /*
  |--------------------------------------------------------------------------
  | Options
  |--------------------------------------------------------------------------
  */

  const categoryOptions = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];

    return [
      {
        label: 'همه دسته‌بندی‌ها',

        value: '',
      },

      ...list.map((category) => ({
        label: category.title,

        value: String(category.id),
      })),
    ];
  }, [categories]);

  const sortOptions = useMemo(() => {
    if (!canPriceSort) {
      return [
        {
          label: 'جدیدترین',

          value: 'newest',
        },
      ];
    }

    return [
      {
        label: 'جدیدترین',

        value: 'newest',
      },

      {
        label: 'گران‌ترین',

        value: 'price_desc',
      },

      {
        label: 'ارزان‌ترین',

        value: 'price_asc',
      },
    ];
  }, [canPriceSort]);

  const colorsList = Array.isArray(colors) ? colors : [];

  /*
  |--------------------------------------------------------------------------
  | Color
  |--------------------------------------------------------------------------
  */

  const toggleColor = (colorId) => {
    setDraft((prev) => {
      const exists = (prev.colorIds || []).includes(colorId);

      return {
        ...prev,

        colorIds: exists
          ? (prev.colorIds || []).filter((item) => item !== colorId)
          : [...(prev.colorIds || []), colorId],

        page: 1,
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    onApply({
      ...draft,
      page: 1,
      _openFilters: false,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Content
  |--------------------------------------------------------------------------
  */

  const content = (
    <div className='space-y-6'>
      {/* Search */}
      <div>
        <label
          htmlFor={`product-search-${mode}`}
          className='mb-2 block text-xs font-black text-text-light dark:text-text-dark'
        >
          جستجو
        </label>

        <div className='relative'>
          <HiOutlineMagnifyingGlass
            size={18}
            className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-subtext-light dark:text-subtext-dark'
          />

          <input
            id={`product-search-${mode}`}
            type='search'
            value={draft.search || ''}
            placeholder='نام محصول...'
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,

                search: event.target.value,

                page: 1,
              }))
            }
            onKeyDown={handleSearchKeyDown}
            className='h-11 w-full rounded-2xl border border-black/5 bg-background-light/65 py-2 pl-3 pr-10 text-xs text-text-light outline-none transition-all placeholder:text-subtext-light/70 focus:border-secondary/30 focus:ring-4 focus:ring-secondary/5 dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark dark:placeholder:text-subtext-dark/70'
          />
        </div>
      </div>

      {/* Sort */}
      <DropDown
        label='مرتب‌سازی'
        options={sortOptions}
        value={sortValue || 'newest'}
        onChange={(value) => {
          onSortChange?.(value);

          setDraft((prev) => ({
            ...prev,

            sort: value,

            page: 1,
          }));
        }}
        fullWidth
        className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
      />

      {/* Divider */}
      <div className='h-px bg-black/5 dark:bg-white/10' />

      {/* Category */}
      <DropDown
        label='دسته‌بندی'
        options={categoryOptions}
        value={draft.categoryId ? String(draft.categoryId) : ''}
        onChange={(value) =>
          setDraft((prev) => ({
            ...prev,

            categoryId: value ? Number(value) : null,

            page: 1,
          }))
        }
        fullWidth
        placeholder='همه دسته‌بندی‌ها'
        className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        optionClassName='max-h-52 overflow-y-auto custom-scrollbar'
      />

      {/* Price */}
      <div>
        <h3 className='mb-3 text-xs font-black text-text-light dark:text-text-dark'>
          محدوده قیمت
        </h3>

        <div className='grid grid-cols-1 gap-3'>
          <Input
            label='حداقل قیمت'
            value={draft.minPrice ?? ''}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,

                minPrice: value,

                page: 1,
              }))
            }
            thousandSeparator
            className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          />

          <Input
            label='حداکثر قیمت'
            value={draft.maxPrice ?? ''}
            onChange={(value) =>
              setDraft((prev) => ({
                ...prev,

                maxPrice: value,

                page: 1,
              }))
            }
            thousandSeparator
            className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          />
        </div>
      </div>

      {/* Stock */}
      <div className='rounded-2xl border border-black/5 bg-background-light/50 p-3 dark:border-white/10 dark:bg-background-dark/35'>
        <Checkbox
          label='فقط محصولات موجود'
          checked={Boolean(draft.inStock)}
          onChange={(value) =>
            setDraft((prev) => ({
              ...prev,

              inStock: value,

              page: 1,
            }))
          }
          labelClass='text-xs font-bold'
        />
      </div>

      {/* Colors */}
      {colorsList.length > 0 && (
        <div>
          <div className='mb-3 flex items-center gap-2'>
            <HiOutlineSwatch size={18} className='text-secondary' />

            <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
              رنگ
            </h3>
          </div>

          <div className='flex flex-wrap gap-2'>
            {colorsList.map((color) => {
              const active = (draft.colorIds || []).includes(color.id);

              return (
                <button
                  key={color.id}
                  type='button'
                  onClick={() => toggleColor(color.id)}
                  className={`flex min-h-9 items-center gap-2 rounded-xl border px-3 text-[10px] font-bold transition-all duration-200 ${
                    active
                      ? 'border-secondary bg-secondary/10 text-secondary shadow-[0_8px_20px_rgba(38,145,125,0.08)]'
                      : 'border-black/5 bg-background-light/50 text-text-light hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/35 dark:text-text-dark'
                  }`}
                >
                  <span
                    className='h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm'
                    style={{
                      background: color.hex,
                    }}
                  />

                  {color.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex gap-2 border-t border-black/5 pt-5 dark:border-white/10'>
        <SiteButton
          type='button'
          variant='primary'
          size='md'
          className='flex-1'
          onClick={() =>
            onApply({
              ...draft,

              _openFilters: false,
            })
          }
        >
          اعمال فیلترها
        </SiteButton>

        <SiteButton type='button' variant='outline' size='md' onClick={onClear}>
          پاک کردن
        </SiteButton>
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Sidebar
  |--------------------------------------------------------------------------
  */

  if (mode === 'sidebar') {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className='sticky top-24 overflow-hidden p-5'
      >
        <div className='mb-5 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineAdjustmentsHorizontal size={20} />
          </span>

          <div>
            <h2 className='text-sm font-black text-text-light dark:text-text-dark'>
              فیلتر محصولات
            </h2>

            <p className='mt-0.5 text-[10px] text-subtext-light dark:text-subtext-dark'>
              انتخاب دقیق‌تر محصول
            </p>
          </div>
        </div>

        {content}
      </SiteCard>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Mobile Drawer
  |--------------------------------------------------------------------------
  */

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50' data-bottom-sheet-open='true'>
      <button
        type='button'
        aria-label='بستن فیلتر'
        className='absolute inset-0 bg-black/45 backdrop-blur-sm'
        onClick={onClose}
      />

      <div className='absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[30px] border-t border-white/10 bg-surface-light px-4 pb-8 pt-3 shadow-[0_-25px_70px_rgba(0,0,0,0.18)] dark:bg-surface-dark'>
        {/* Handle */}
        <div className='mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 dark:bg-white/20' />

        <div className='mb-5 flex items-center justify-between border-b border-black/5 pb-4 dark:border-white/10'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineAdjustmentsHorizontal size={20} />
            </span>

            <div>
              <h2 className='text-sm font-black text-text-light dark:text-text-dark'>
                فیلتر محصولات
              </h2>

              <p className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                جستجو و مرتب‌سازی
              </p>
            </div>
          </div>

          <button
            type='button'
            onClick={onClose}
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-text-light transition-colors hover:bg-secondary/10 hover:text-secondary dark:bg-white/5 dark:text-text-dark'
          >
            <HiOutlineXMark size={20} />
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
