/* eslint-disable no-undef */
'use server';

import { setUser } from '@/libs/redux/features/userSlice';
import { store } from '@/libs/redux/store';

export const updateUser = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get-me`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await res.json();

    if (data.success) {
      // مستقیماً در Redux ذخیره می‌کنیم
      store.dispatch(setUser(data.user));
      return { success: true, user: data.user };
    } else {
      console.error('Failed to update user data.');
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};
