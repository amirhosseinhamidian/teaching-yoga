'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';

import Modal from '@/components/modules/Modal/Modal';

import {
  HiOutlineMinus,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlineShoppingBag,
  HiOutlineTrash,
} from 'react-icons/hi2';

const formatToman = (value) => {
  const number = Number(value || 0);

  return number.toLocaleString('fa-IR');
};

export default function ShopCartItem({
  data,
  onDeleteItem,
  onUpdateQty,
  isLoading,
}) {
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);

  const [imageError, setImageError] = useState(false);

  const maxQty = useMemo(() => Number(data?.stock ?? 0), [data?.stock]);

  const qty = Number(data?.qty ?? 1);

  const lineTotal = useMemo(
    () => Number(data?.unitPrice || 0) * qty,
    [data?.unitPrice, qty]
  );

  const unitPrice = Number(data?.unitPrice || 0);

  const compareAt = Number(data?.compareAt || 0);

  const hasDiscount = compareAt > unitPrice && compareAt > 0;

  const handleDelete = async () => {
    await onDeleteItem?.(data.id);

    setShowDeleteItemModal(false);
  };

  const handleMinus = async () => {
    if (qty <= 1) {
      setShowDeleteItemModal(true);

      return;
    }

    await onUpdateQty?.(data.id, qty - 1);
  };

  const handlePlus = async () => {
    if (maxQty > 0 && qty >= maxQty) {
      return;
    }

    await onUpdateQty?.(data.id, qty + 1);
  };

  return (
    <>
      <article className='group p-4 sm:p-5'>
        <div className='flex items-start gap-3 sm:gap-4'>
          {/* Image */}
          <div className='relative aspect-square w-24 shrink-0 overflow-hidden rounded-[18px] border border-black/5 bg-background-light/60 sm:w-28 dark:border-white/10 dark:bg-background-dark/35'>
            {data.coverImage && !imageError ? (
              <Image
                src={data.coverImage}
                alt={data.productTitle || 'محصول'}
                fill
                sizes='112px'
                className='object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]'
                onError={() => setImageError(true)}
              />
            ) : (
              <div className='absolute inset-0 flex items-center justify-center text-secondary/40'>
                <HiOutlinePhoto size={25} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='mb-1.5 flex items-center gap-1.5 text-[9px] font-bold text-secondary sm:text-[10px]'>
                  <HiOutlineShoppingBag size={14} />
                  محصول فروشگاه
                </div>

                <h3 className='line-clamp-2 text-sm font-black leading-6 text-text-light sm:text-base sm:leading-7 dark:text-text-dark'>
                  {data.productTitle}
                </h3>
              </div>

              <button
                type='button'
                aria-label='حذف محصول'
                onClick={() => setShowDeleteItemModal(true)}
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red transition-all duration-200 hover:scale-105 hover:bg-red hover:text-white'
              >
                <HiOutlineTrash size={18} />
              </button>
            </div>

            {/* Variants */}
            {(data?.color?.name || data?.size?.name) && (
              <div className='mt-2.5 flex flex-wrap gap-1.5'>
                {data?.color?.name && (
                  <span className='inline-flex items-center gap-1.5 rounded-xl border border-black/5 bg-background-light/50 px-2.5 py-1.5 text-[9px] font-bold text-subtext-light dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
                    <span
                      className='h-3 w-3 rounded-full border border-black/10 dark:border-white/20'
                      style={{
                        backgroundColor: data.color.hex,
                      }}
                    />

                    {data.color.name}
                  </span>
                )}

                {data?.size?.name && (
                  <span className='rounded-xl border border-black/5 bg-background-light/50 px-2.5 py-1.5 text-[9px] text-subtext-light dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
                    سایز:{' '}
                    <strong className='font-faNa text-text-light dark:text-text-dark'>
                      {data.size.name}
                    </strong>
                  </span>
                )}
              </div>
            )}

            {/* Price + qty */}
            <div className='mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                {hasDiscount && (
                  <div className='mb-1 flex items-baseline gap-1'>
                    <span className='font-faNa text-[10px] text-subtext-light line-through dark:text-subtext-dark'>
                      {formatToman(compareAt)}
                    </span>

                    <span className='text-[8px] text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  </div>
                )}

                <div className='flex items-baseline gap-1'>
                  <strong className='font-faNa text-base font-black sm:text-lg'>
                    {formatToman(lineTotal)}
                  </strong>

                  <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                    تومان
                  </span>
                </div>

                {qty > 1 && (
                  <p className='mt-1 font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                    قیمت واحد: {formatToman(data.unitPrice)} تومان
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <div className='flex w-fit items-center gap-1.5 rounded-2xl border border-black/5 bg-background-light/60 p-1.5 dark:border-white/10 dark:bg-background-dark/35'>
                  <button
                    type='button'
                    disabled={isLoading}
                    onClick={handleMinus}
                    aria-label='کاهش تعداد'
                    className='flex h-9 w-9 items-center justify-center rounded-xl border border-black/5 bg-surface-light text-text-light transition-all hover:border-secondary/25 hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-surface-dark dark:text-text-dark'
                  >
                    {qty <= 1 ? (
                      <HiOutlineTrash size={16} />
                    ) : (
                      <HiOutlineMinus size={17} />
                    )}
                  </button>

                  <span className='min-w-9 text-center font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                    {qty.toLocaleString('fa-IR')}
                  </span>

                  <button
                    type='button'
                    disabled={isLoading || (maxQty > 0 && qty >= maxQty)}
                    onClick={handlePlus}
                    aria-label='افزایش تعداد'
                    className='flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40'
                  >
                    <HiOutlinePlus size={17} />
                  </button>
                </div>

                {maxQty > 0 && qty >= maxQty && (
                  <p className='mt-1.5 text-[9px] font-bold text-red'>
                    به سقف موجودی رسیدید
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {showDeleteItemModal && (
        <Modal
          title='حذف محصول از سبد خرید'
          desc={`آیا از حذف "${data.productTitle}" از سبد خرید خود مطمئن هستید؟`}
          icon={HiOutlineTrash}
          iconSize={26}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteItemModal(false)}
          secondaryButtonClick={handleDelete}
        />
      )}
    </>
  );
}

ShopCartItem.propTypes = {
  data: PropTypes.object.isRequired,

  onDeleteItem: PropTypes.func.isRequired,

  onUpdateQty: PropTypes.func.isRequired,

  isLoading: PropTypes.bool,
};
