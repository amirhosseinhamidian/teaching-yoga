'use client';

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({ product }) {
  const cover =
    product.coverImage ||
    (Array.isArray(product.images) ? product.images[0] : null);

  const isOut = (product.stock ?? 0) <= 0;

  const price = Number(product.price || 0);
  const compareAt =
    product.compareAt != null ? Number(product.compareAt) : null;

  const hasDiscount = compareAt != null && compareAt > 0 && compareAt > price;

  const discountPercent = useMemo(() => {
    if (!hasDiscount) return 0;
    const pct = ((compareAt - price) / compareAt) * 100;
    return Math.round(pct); // بدون اعشار
  }, [hasDiscount, compareAt, price]);

  const priceText = useMemo(() => {
    return price > 0 ? price.toLocaleString('fa-IR') : '—';
  }, [price]);

  const compareText = useMemo(() => {
    if (!hasDiscount) return '';
    return compareAt.toLocaleString('fa-IR');
  }, [hasDiscount, compareAt]);

  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className='group flex flex-col overflow-hidden rounded-2xl bg-surface-light shadow-sm transition duration-150 ease-in hover:shadow-md dark:bg-surface-dark'
    >
      <div className='relative aspect-[4/3] w-full bg-foreground-light dark:bg-foreground-dark'>
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            className='object-cover transition-transform duration-150 ease-in group-hover:scale-[1.03]'
          />
        ) : (
          <div className='flex h-full items-center justify-center text-xs text-subtext-light dark:text-subtext-dark'>
            بدون تصویر
          </div>
        )}

        {!product.isActive && (
          <span className='absolute right-2 top-2 rounded-full bg-red px-2 py-1 text-xs text-white'>
            غیرفعال
          </span>
        )}

        {isOut && (
          <span className='absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white'>
            ناموجود
          </span>
        )}

        {/* ✅ درصد تخفیف */}
        {hasDiscount && discountPercent > 0 && (
          <span className='absolute bottom-2 left-2 rounded-lg bg-rose-600 px-2 font-faNa text-2xs font-bold text-white lg:text-xs'>
            {discountPercent}٪
          </span>
        )}
      </div>

      <div className='flex flex-1 flex-col gap-2 p-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='line-clamp-2 text-sm font-semibold'>
            {product.title}
          </h3>
          <span className='text-xs text-subtext-light dark:text-subtext-dark'>
            {product.category?.title}
          </span>
        </div>

        {/* ✅ قیمت‌ها */}
        <div className='flex flex-col'>
          <div className='flex items-center gap-1'>
            <span className='font-faNa text-base font-bold md:text-lg'>
              {priceText}
            </span>
            <span className='text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
              تومان
            </span>
          </div>
          {hasDiscount && (
            <div className='flex items-center gap-1'>
              <span className='text-xs text-subtext-light line-through dark:text-subtext-dark'>
                {compareText}
              </span>
              <span className='text-2xs text-subtext-light dark:text-subtext-dark'>
                تومان
              </span>
            </div>
          )}
        </div>

        {/* colors (اختیاری) */}
        {Array.isArray(product.colors) && product.colors.length > 0 && (
          <div className='mt-1 flex items-center gap-1'>
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.id}
                className='h-3 w-3 rounded-full border'
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
};
