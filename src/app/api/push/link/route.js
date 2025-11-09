// app/api/push/link/route.js
import { NextResponse } from 'next/server';
import {
  __getSubscriptionsForKey,
  __removeSubscriptionForKey,
  __userKey,
} from '@/app/api/push/subscribe/route';

// این فقط برای تست لوکال با Mapـه؛ در نسخه DB باید تو جدول update کنی
export async function POST(req) {
  try {
    const { userId, anonymousId } = await req.json();
    if (!userId || !anonymousId) {
      return NextResponse.json({ ok: false, error: 'userId & anonymousId required' }, { status: 400 });
    }

    const anonKey = __userKey({ anonymousId });
    const userKey = __userKey({ userId });

    const anonSubs = __getSubscriptionsForKey(anonKey);
    const userSubs = __getSubscriptionsForKey(userKey);

    // ادغام: هر subscriptionی که برای anonymous هست، برای user هم ثبت کن
    const endpointsUser = new Set(userSubs.map((s) => s.endpoint));
    const merged = [...userSubs];

    anonSubs.forEach((sub) => {
      if (!endpointsUser.has(sub.endpoint)) {
        merged.push(sub);
      }
    });

    // در این نسخه ساده، فقط روی userKey ست می‌کنیم، anonKey را می‌توانی نگه داری یا پاک کنی
    // eslint-disable-next-line no-undef
    const globalAny = global;
    globalAny.__SUBS__ = globalAny.__SUBS__ || new Map();
    globalAny.__SUBS__.set(userKey, merged);

    return NextResponse.json({
      ok: true,
      userKey,
      anonKey,
      counts: {
        user: userSubs.length,
        anon: anonSubs.length,
        merged: merged.length,
      },
    });
  } catch (e) {
    console.error('[PUSH_LINK_ERROR]', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
