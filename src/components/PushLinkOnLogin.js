/* eslint-disable no-undef */
'use client';

import { useEffect } from 'react';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { getAnonymousId } from '@/utils/localStorageHelper';

export function PushLinkOnLogin() {
  const { user } = useAuthUser(); // فقط state

  useEffect(() => {
    if (!user?.id) return; // تا وقتی لاگین نشده، اجرا نشه

    const anon = getAnonymousId();
    if (!anon) return;

    (async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/push/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            anonymousId: anon,
          }),
        });
      } catch (err) {
        console.error('[PUSH_LINK_ON_LOGIN]', err);
      }
    })();
  }, [user?.id]);

  return null;
}
