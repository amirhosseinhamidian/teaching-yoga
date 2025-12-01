'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUserFromServer } from '@/libs/redux/features/userSlice';

export default function UserHydration({ user }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setUserFromServer(user));
  }, [user]);

  return null;
}
