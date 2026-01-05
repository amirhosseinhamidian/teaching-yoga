/* eslint-disable react/prop-types */
'use client';

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { LuTrash } from 'react-icons/lu';

function Chip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      className='flex items-center gap-2 rounded-full bg-foreground-light px-3 py-1 text-xs md:text-sm dark:bg-foreground-dark'
      type='button'
    >
      <span>{label}</span>
      <span className='text-red'>
        <IoClose />
      </span>
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
    if (!query.categoryId) return null;
    const c = categories.find((x) => x.id === query.categoryId);
    return c?.title || null;
  }, [query.categoryId, categories]);

  const selectedColors = useMemo(() => {
    if (!query.colorIds?.length) return [];
    const map = new Map(colors.map((c) => [c.id, c]));
    return query.colorIds.map((id) => map.get(id)).filter(Boolean);
  }, [query.colorIds, colors]);

  const hasAny =
    !!query.categoryId ||
    !!query.inStock ||
    (query.minPrice !== '' && query.minPrice != null) ||
    (query.maxPrice !== '' && query.maxPrice != null) ||
    (query.colorIds?.length || 0) > 0;

  if (!hasAny) return null;

  return (
    <div className='mt-4 flex flex-wrap items-center gap-2'>
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
          label={`از ${Number(query.minPrice).toLocaleString('fa-IR')}`}
          onRemove={() => onRemove('minPrice')}
        />
      )}

      {query.maxPrice !== '' && query.maxPrice != null && (
        <Chip
          label={`تا ${Number(query.maxPrice).toLocaleString('fa-IR')}`}
          onRemove={() => onRemove('maxPrice')}
        />
      )}

      {selectedColors.map((c) => (
        <Chip
          key={c.id}
          label={`رنگ: ${c.name}`}
          onRemove={() => onRemove('color', c.id)}
        />
      ))}

      <button
        className='flex items-center gap-2 rounded-full bg-foreground-light px-3 py-1 text-xs md:text-sm dark:bg-foreground-dark'
        onClick={onClearAll}
      >
        پاک کردن همه
        <LuTrash className='text-red' />
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
