'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { LuTrash } from 'react-icons/lu';
import { FiMinus, FiPlus } from 'react-icons/fi';
import Modal from '@/components/modules/Modal/Modal';
import Button from '@/components/Ui/Button/Button';

const formatToman = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('fa-IR');
};

export default function ShopCartItem({
  data,
  onDeleteItem,
  onUpdateQty,
  isLoading,
}) {
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);

  const maxQty = useMemo(() => Number(data?.stock ?? 0), [data?.stock]);
  const qty = Number(data?.qty ?? 1);

  const lineTotal = useMemo(
    () => Number(data?.unitPrice || 0) * qty,
    [data?.unitPrice, qty]
  );

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
    if (maxQty > 0 && qty >= maxQty) return;
    await onUpdateQty?.(data.id, qty + 1);
  };

  return (
    <>
      <div className='flex items-start justify-between gap-3 p-4'>
        <div className='flex flex-wrap gap-2 md:gap-4'>
          <Image
            src={data.coverImage || '/images/placeholder.png'}
            alt={data.productTitle || 'محصول'}
            width={360}
            height={280}
            className='h-9 w-14 rounded-lg object-cover xs:h-14 xs:w-20 sm:h-20 sm:w-28'
          />

          <div className='min-w-[180px]'>
            <h3 className='text-base md:text-lg'>{data.productTitle}</h3>

            {/* color/size */}
            <div className='mt-1 flex flex-wrap gap-2 text-2xs text-subtext-light dark:text-subtext-dark'>
              {data?.color?.name && (
                <span className='inline-flex items-center gap-2 rounded-lg bg-foreground-light px-2 py-1 text-xs dark:bg-foreground-dark'>
                  <span
                    className='h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/20'
                    style={{ backgroundColor: data.color.hex }}
                  />
                  <span className='font-medium'>{data.color.name}</span>
                </span>
              )}
              {data?.size?.name && (
                <span className='rounded-lg bg-foreground-light px-2 py-1 dark:bg-foreground-dark'>
                  سایز:{' '}
                  <span className='font-faNa font-bold'>{data.size.name}</span>
                </span>
              )}
            </div>

            {/* price */}
            <div className='mt-2 space-y-1'>
              <div className='font-faNa text-xs'>
                قیمت واحد: {formatToman(data.unitPrice)}{' '}
                <span className='text-[8px] sm:text-2xs'>تومان</span>
              </div>

              <div className='font-faNa text-sm font-bold sm:text-base'>
                جمع: {formatToman(lineTotal)}{' '}
                <span className='text-[8px] sm:text-2xs'>تومان</span>
              </div>
            </div>

            {/* qty controls */}
            <div className='mt-3 flex items-center gap-1'>
              <Button
                onClick={handleMinus}
                disabled={isLoading}
                className='flex !h-7 !w-7 items-center justify-center !rounded-lg !p-0'
                shadow
              >
                <FiMinus />
              </Button>

              <div className='min-w-8 rounded-lg bg-foreground-light px-1 py-0.5 text-center font-faNa text-sm font-bold dark:bg-foreground-dark'>
                {qty}
              </div>

              <Button
                onClick={handlePlus}
                disabled={isLoading || (maxQty > 0 && qty >= maxQty)}
                className='flex !h-7 !w-7 items-center justify-center !rounded-lg !p-0'
                shadow
              >
                <FiPlus />
              </Button>

              {maxQty > 0 && qty >= maxQty && (
                <span className='text-2xs text-red'>به سقف موجودی رسیدید</span>
              )}
            </div>
          </div>
        </div>

        <LuTrash
          size={20}
          className='ml-4 mt-2 text-red md:cursor-pointer'
          onClick={() => setShowDeleteItemModal(true)}
        />
      </div>

      {showDeleteItemModal && (
        <Modal
          title='حذف محصول از سبد خرید'
          desc={`آیا از حذف "${data.productTitle}" از سبد خرید خود مطمئن هستید؟`}
          icon={LuTrash}
          iconSize={32}
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
