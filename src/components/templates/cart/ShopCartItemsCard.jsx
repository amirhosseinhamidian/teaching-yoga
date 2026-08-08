'use client';

import React, { useMemo } from 'react';

import ShopCartItem from './ShopCartItem';

import { useShopCart } from '@/hooks/shopCart/useShopCart';

import { useShopCartActions } from '@/hooks/shopCart/useShopCartActions';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { HiOutlineShoppingBag } from 'react-icons/hi2';

// eslint-disable-next-line react/prop-types
export default function ShopCartItemsCard({ className }) {
  const { items, loading } = useShopCart();

  const { removeShopItem, updateShopItemQty } = useShopCartActions();

  const totalQty = useMemo(() => {
    if (!Array.isArray(items)) {
      return 0;
    }

    return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }, [items]);

  const handleDeleteItem = async (itemId) => {
    await removeShopItem({
      itemId,
    });
  };

  const handleUpdateQty = async (itemId, qty) => {
    await updateShopItemQty({
      itemId,
      qty,
    });
  };

  if (!items?.length) {
    return null;
  }

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`overflow-hidden ${className || ''}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-5 dark:border-white/10'>
        <div className='flex items-center gap-3'>
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineShoppingBag size={21} />
          </span>

          <div>
            <h2 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              محصولات فروشگاه
            </h2>

            <p className='mt-0.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
              محصولات انتخاب‌شده
            </p>
          </div>
        </div>

        <SiteBadge variant='secondary' size='sm'>
          {totalQty.toLocaleString('fa-IR')} محصول
        </SiteBadge>
      </div>

      {/* Items */}
      <div>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={
              index < items.length - 1
                ? 'border-b border-black/5 dark:border-white/10'
                : ''
            }
          >
            <ShopCartItem
              data={item}
              isLoading={loading}
              onDeleteItem={handleDeleteItem}
              onUpdateQty={handleUpdateQty}
            />
          </div>
        ))}
      </div>
    </SiteCard>
  );
}
