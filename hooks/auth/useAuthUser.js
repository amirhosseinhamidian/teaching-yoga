'use client';

import { useSelector } from 'react-redux';

export function useAuthUser() {
  const user = useSelector((state) => state.user.data);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const loading = useSelector((state) => state.user.loading);
  const error = useSelector((state) => state.user.error);

  return {
    user,
    isAuthenticated,
    loading,
    error,
  };
}
