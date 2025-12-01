'use client';

import { useEffect, useRef } from 'react';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useCartActions } from '@/hooks/cart/useCartActions';

export default function CartBootstrapper() {
  const { isAuthenticated } = useAuthUser();
  const { fetchCart } = useCartActions();

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      fetchCart(); // فقط یکبار
      hasFetchedRef.current = true;
    }

    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
}
