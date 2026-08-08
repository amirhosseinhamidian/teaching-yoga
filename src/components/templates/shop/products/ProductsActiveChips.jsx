/* eslint-disable react/prop-types */
'use client';

import React, { useMemo } from 'react';

import PropTypes from 'prop-types';

import { IoClose } from 'react-icons/io5';

import { HiOutlineTrash } from 'react-icons/hi2';

function Chip({ label, onRemove, color }) {
  return (
    <button
      type='button'
      onClick={onRemove}
      className='group flex min-h-9 items-center gap-2 rounded-xl border border-black/5 bg-surface-light/75 px-3 text-[10px] font-bold text-text-light shadow-sm backdrop-blur-md transition-all duration-200 hover:border-secondary/25 hover:bg-secondary/5 hover:text-secondary sm:text-xs dark:border-white/10 dark:bg-surface-dark/70 dark:text-text-dark'
    >
      {color && (
        <span
          className='h-3.5 w-3.5 rounded-full border border-black/10'
          style={{
            backgroundColor: color,
          }}
        />
      )}

      <span>{label}</span>

      <IoClose
        size={15}
        className='text-subtext-light transition-colors group-hover:text-secondary dark:text-subtext-dark'
      />
    </button>
  );
}

export default function ProductsActiveChips({
  query,
  categories,
  colors,
  onRemove,
  onClearAll,
}) {
  const categoryTitle = useMemo(() => {
    if (!query.categoryId) {
      return null;
    }

    const category = categories.find((item) => item.id === query.categoryId);

    return category?.title || null;
  }, [query.categoryId, categories]);

  const selectedColors = useMemo(() => {
    if (!query.colorIds?.length) {
      return [];
    }

    const map = new Map(colors.map((color) => [color.id, color]));

    return query.colorIds.map((id) => map.get(id)).filter(Boolean);
  }, [query.colorIds, colors]);

  const hasAny =
    Boolean(query.categoryId) ||
    Boolean(query.inStock) ||
    (query.minPrice !== '' && query.minPrice != null) ||
    (query.maxPrice !== '' && query.maxPrice != null) ||
    (query.colorIds?.length || 0) > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <div className='mb-4 flex flex-wrap items-center gap-2'>
      {categoryTitle && (
        <Chip
          label={`دسته: ${categoryTitle}`}
          onRemove={() => onRemove('category')}
        />
      )}

      {query.inStock && (
        <Chip label='فقط موجودها' onRemove={() => onRemove('inStock')} />
      )}

      {query.minPrice !== '' && query.minPrice != null && (
        <Chip
          label={`از ${Number(query.minPrice).toLocaleString('fa-IR')} تومان`}
          onRemove={() => onRemove('minPrice')}
        />
      )}

      {query.maxPrice !== '' && query.maxPrice != null && (
        <Chip
          label={`تا ${Number(query.maxPrice).toLocaleString('fa-IR')} تومان`}
          onRemove={() => onRemove('maxPrice')}
        />
      )}

      {selectedColors.map((color) => (
        <Chip
          key={color.id}
          label={color.name}
          color={color.hex}
          onRemove={() => onRemove('color', color.id)}
        />
      ))}

      <button
        type='button'
        onClick={onClearAll}
        className='flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-[10px] font-bold text-red transition-opacity hover:opacity-70 sm:text-xs'
      >
        <HiOutlineTrash size={15} />
        پاک کردن همه
      </button>
    </div>
  );
}

ProductsActiveChips.propTypes = {
  query: PropTypes.object.isRequired,

  categories: PropTypes.array.isRequired,

  colors: PropTypes.array.isRequired,

  onRemove: PropTypes.func.isRequired,

  onClearAll: PropTypes.func.isRequired,
};
