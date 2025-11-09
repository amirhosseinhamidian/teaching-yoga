/* eslint-disable no-undef */
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAnonymousId } from '@/utils/localStorageHelper';

export function PushLinkOnLogin() {
  const { data: session } = useSession();

  useEffect(() => {
    const userId = session?.user?.userId;
    if (!userId) return;

    const anon = getAnonymousId();
    if (!anon) return;

    // یک بار سعی کن anonymous → user را لینک کنی
    (async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/push/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, anonymousId: anon }),
        });
      } catch (e) {
        console.error('[PUSH_LINK_ON_LOGIN]', e);
      }
    })();
  }, [session?.user?.userId]);

  return null;
}