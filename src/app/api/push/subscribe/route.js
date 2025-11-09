// app/api/push/subscribe/route.js
import { NextResponse } from 'next/server';

// ⚠️ فقط برای تست لوکال/تک‌پروسس — در پراکشن DB بزن
// eslint-disable-next-line no-undef
const globalAny = global;
globalAny.__SUBS__ = globalAny.__SUBS__ || new Map();

function userKey({ userId, anonymousId }) {
  return userId ? `u:${userId}` : `a:${anonymousId}`;
}

export async function POST(req) {
  try {
    const { subscription, userId = null, anonymousId = null } = await req.json();
    if (!subscription || (!userId && !anonymousId)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    // نرمال‌سازی (toJSON اگر آبجکت push باشد)
    const sub = typeof subscription === 'string' ? JSON.parse(subscription) :
                subscription?.endpoint ? subscription :
                subscription?.toJSON ? subscription.toJSON() : null;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: 'bad subscription shape' }, { status: 400 });
    }

    const key = userKey({ userId, anonymousId });
    const list = globalAny.__SUBS__.get(key) || [];
    const exists = list.find((s) => s.endpoint === sub.endpoint);
    if (!exists) list.push(sub);
    globalAny.__SUBS__.set(key, list);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('[PUSH_SUBSCRIBE_ERROR]', e);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

// helperها را export کن تا notifyReply همین‌ها را استفاده کند
export function __getSubscriptionsForKey(key) {
  const map = globalAny.__SUBS__ || new Map();
  return map.get(key) || [];
}
export function __removeSubscriptionForKey(key, endpoint) {
  const map = globalAny.__SUBS__ || new Map();
  const list = map.get(key) || [];
  map.set(key, list.filter((s) => s.endpoint !== endpoint));
}
export function __userKey(obj){ return userKey(obj); }
