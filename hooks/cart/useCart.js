'use client';

import { useSelector } from 'react-redux';
export function useCart() {
  return useSelector((state) => state.cart);
}
