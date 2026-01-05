'use client';
import { useSelector } from 'react-redux';

export const useShopCart = () => {
  return useSelector((state) => state.shopCart);
};
