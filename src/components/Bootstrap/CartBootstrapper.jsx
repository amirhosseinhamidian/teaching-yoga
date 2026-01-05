'use client';

import { useEffect, useRef } from 'react';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useCartActions } from '@/hooks/cart/useCartActions';
import { useShopCartActions } from '@/hooks/shopCart/useShopCartActions';

export default function CartBootstrapper() {
  const { isAuthenticated } = useAuthUser();

  const { fetchCart } = useCartActions();
  const { fetchShopCart } = useShopCartActions();

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      // ✅ هر دو سبد فقط یکبار
      fetchCart();
      fetchShopCart();

      hasFetchedRef.current = true;
    }

    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated, fetchCart, fetchShopCart]);

  return null;
}
