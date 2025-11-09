// libs/notifyReply.js
import webpush from 'web-push';
import {
  __getSubscriptionsForKey,
  __removeSubscriptionForKey,
  __userKey,
} from '@/app/api/push/subscribe/route';

webpush.setVapidDetails(
  'mailto:admin@yourdomain.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 🔹 فقط برای نوتیف: تبدیل HTML به متن ساده
function stripHtml(html = '') {
  // حذف همه تگ‌ها
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  // جمع‌کردن فاصله‌های اضافه
  return withoutTags.replace(/\s+/g, ' ').trim();
}

export async function notifyReply(to, url, preview = '') {
  const keys = [];
  if (to.userId)      keys.push(__userKey({ userId: to.userId }));
  if (to.anonymousId) keys.push(__userKey({ anonymousId: to.anonymousId }));

  console.log('[notifyReply] keys:', keys);

  const subs = keys.flatMap((k) => __getSubscriptionsForKey(k));
  console.log('[notifyReply] subs count:', subs.length);

  if (!subs.length) {
    console.log('[notifyReply] no subs for keys', keys);
    return;
  }

  // 🔹 اینجا فقط برای نوتیف، HTML رو به متن تبدیل می‌کنیم
  const plainPreview = stripHtml(preview);
  const shortPreview = plainPreview.slice(0, 140) || 'برای مشاهده پاسخ کلیک کنید.';

  const payload = JSON.stringify({
    title: 'پاسخ جدید به سؤال شما',
    body: shortPreview,
    url,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        console.log('[notifyReply] sent OK to', sub.endpoint.slice(0, 60), '…');
      } catch (err) {
        console.error('[notifyReply] webpush error', err?.statusCode, err?.body || err?.message);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          keys.forEach((key) => __removeSubscriptionForKey(key, sub.endpoint));
        }
      }
    })
  );
}
