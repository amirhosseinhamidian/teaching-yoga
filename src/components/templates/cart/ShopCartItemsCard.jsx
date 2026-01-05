'use client';

import React from 'react';
import ShopCartItem from './ShopCartItem';
import { useShopCart } from '@/hooks/shopCart/useShopCart';
import { useShopCartActions } from '@/hooks/shopCart/useShopCartActions';
import { useSelector } from 'react-redux';

// eslint-disable-next-line react/prop-types
export default function ShopCartItemsCard({ className }) {
  const { items, loading } = useShopCart();
  const { removeShopItem, updateShopItemQty } = useShopCartActions();

  const handleDeleteItem = async (itemId) => {
    await removeShopItem({ itemId });
  };

  const handleUpdateQty = async (itemId, qty) => {
    await updateShopItemQty({ itemId, qty });
  };

  const shopCart = useShopCart();

  console.log(
    'FULL REDUX STATE:',
    useSelector((state) => state)
  );
  console.log('SHOP CART SLICE:', shopCart);
  console.log('shop card item =======> ', items);

  if (!items?.length) return null;

  return (
    <div
      className={`rounded-xl bg-surface-light shadow dark:bg-surface-dark ${className}`}
    >
      {items.map((item, index) => (
        <div key={item.id}>
          <ShopCartItem
            data={item}
            isLoading={loading}
            onDeleteItem={handleDeleteItem}
            onUpdateQty={handleUpdateQty}
          />

          {index < items.length - 1 && (
            <hr className='mx-8 my-2 border-t border-gray-300 dark:border-gray-600' />
          )}
        </div>
      ))}
    </div>
  );
}
