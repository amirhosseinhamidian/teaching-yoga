'use client';
import { useDispatch } from 'react-redux';
import {
  fetchShopCart,
  addShopItem,
  removeShopItem,
  updateShopItemQty,
} from '@/libs/redux/features/shopCartSlice';

export const useShopCartActions = () => {
  const dispatch = useDispatch();

  return {
    fetchShopCart: () => dispatch(fetchShopCart()),
    addShopItem: (payload) => dispatch(addShopItem(payload)),
    removeShopItem: (payload) => dispatch(removeShopItem(payload)),
    updateShopItemQty: (payload) => dispatch(updateShopItemQty(payload)),
  };
};
