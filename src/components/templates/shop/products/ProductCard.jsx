'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineArrowLeft,
  HiOutlinePhoto,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);

  const cover =
    product.coverImage ||
    (Array.isArray(product.images) ? product.images[0] : null);

  const isOut = (product.stock ?? 0) <= 0;

  const price = Number(product.price || 0);

  const compareAt =
    product.compareAt != null ? Number(product.compareAt) : null;

  const hasDiscount = compareAt != null && compareAt > 0 && compareAt > price;

  const discountPercent = useMemo(() => {
    if (!hasDiscount) {
      return 0;
    }

    const pct = ((compareAt - price) / compareAt) * 100;

    return Math.round(pct);
  }, [hasDiscount, compareAt, price]);

  const priceText = useMemo(() => {
    return price > 0 ? price.toLocaleString('fa-IR') : '—';
  }, [price]);

  const compareText = useMemo(() => {
    if (!hasDiscount) {
      return '';
    }

    return compareAt.toLocaleString('fa-IR');
  }, [hasDiscount, compareAt]);

  const colors = Array.isArray(product.colors) ? product.colors : [];

  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className='group block h-full'
    >
      <SiteCard
        as='article'
        variant='glass'
        padding='none'
        radius='lg'
        hover
        className='flex h-full flex-col overflow-hidden'
      >
        {/* ======================
            Image
        ====================== */}
        <div className='relative aspect-[4/3] w-full overflow-hidden bg-background-light/80 dark:bg-background-dark/50'>
          {cover && !imageError ? (
            <Image
              src={cover}
              alt={product.title || 'تصویر محصول'}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
              className='object-cover transition-transform duration-700 group-hover:scale-[1.04]'
              onError={() => setImageError(true)}
            />
          ) : (
            <div className='to-yellow/10 absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary/10 via-transparent'>
              <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <HiOutlinePhoto size={24} />
              </span>

              <span className='text-[10px] font-medium text-subtext-light dark:text-subtext-dark'>
                تصویر محصول
              </span>
            </div>
          )}

          {cover && !imageError && (
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-70' />
          )}

          {/* Category */}
          {product.category?.title && (
            <div className='absolute right-3 top-3'>
              <SiteBadge
                variant='secondary'
                size='sm'
                className='border-white/15 bg-white/90 shadow-sm backdrop-blur-md dark:bg-black/55'
              >
                {product.category.title}
              </SiteBadge>
            </div>
          )}

          {/* Stock */}
          {isOut && (
            <span className='absolute left-3 top-3 rounded-xl border border-white/15 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-md'>
              ناموجود
            </span>
          )}

          {!product.isActive && !isOut && (
            <span className='absolute left-3 top-3 rounded-xl bg-red px-2.5 py-1.5 text-[10px] font-bold text-white'>
              غیرفعال
            </span>
          )}

          {/* Discount */}
          {hasDiscount && discountPercent > 0 && (
            <span className='absolute bottom-3 left-3 rounded-xl bg-secondary px-2.5 py-1.5 font-faNa text-[10px] font-black text-white shadow-lg'>
              ٪{discountPercent.toLocaleString('fa-IR')} تخفیف
            </span>
          )}
        </div>

        {/* ======================
            Content
        ====================== */}
        <div className='flex flex-1 flex-col p-4'>
          <h3 className='line-clamp-2 min-h-[48px] text-sm font-black leading-6 text-text-light transition-colors duration-300 group-hover:text-secondary sm:text-[15px] dark:text-text-dark'>
            {product.title}
          </h3>

          {/* Colors */}
          {colors.length > 0 && (
            <div className='mt-3 flex items-center gap-1.5'>
              {colors.slice(0, 5).map((color) => (
                <span
                  key={color.id}
                  title={color.name}
                  className='h-4 w-4 rounded-full border-2 border-surface-light shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:border-surface-dark dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                  style={{
                    backgroundColor: color.hex,
                  }}
                />
              ))}

              {colors.length > 5 && (
                <span className='mr-1 font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                  +{(colors.length - 5).toLocaleString('fa-IR')}
                </span>
              )}
            </div>
          )}

          <div className='my-4 h-px bg-black/5 dark:bg-white/10' />

          {/* Footer */}
          <div className='mt-auto flex items-end justify-between gap-3'>
            <div>
              {hasDiscount && (
                <div className='mb-0.5 flex items-center gap-1 text-[10px] text-subtext-light dark:text-subtext-dark'>
                  <span className='font-faNa line-through'>{compareText}</span>

                  <span>تومان</span>
                </div>
              )}

              <div className='flex items-baseline gap-1'>
                <strong className='font-faNa text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
                  {priceText}
                </strong>

                <span className='text-[10px] font-medium text-subtext-light dark:text-subtext-dark'>
                  تومان
                </span>
              </div>
            </div>

            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-white'>
              {isOut ? (
                <HiOutlineShoppingBag size={19} />
              ) : (
                <HiOutlineArrowLeft
                  size={18}
                  className='transition-transform duration-300 group-hover:-translate-x-0.5'
                />
              )}
            </span>
          </div>
        </div>
      </SiteCard>
    </Link>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
};
