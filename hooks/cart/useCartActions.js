'use client';

import { useDispatch } from 'react-redux';
import {
  fetchCart,
  addToCart,
  removeFromCart,
  clearServerCart,
  applyDiscount,
} from '@/libs/redux/features/cartSlice';

export function useCartActions() {
  const dispatch = useDispatch();

  return {
    fetchCart: () => dispatch(fetchCart()),
    addToCart: (courseId) => dispatch(addToCart(courseId)),
    removeFromCart: (courseId) => dispatch(removeFromCart(courseId)),
    clearServerCart: () => dispatch(clearServerCart()),
    applyDiscount: ({ code, cartId }) =>
      dispatch(applyDiscount({ code, cartId })),
  };
}
