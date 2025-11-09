// src/lib/notifyAdmins.js
import webpush from 'web-push';
import {
  __getSubscriptionsForKey,
  __removeSubscriptionForKey,
} from '@/app/api/push/subscribe/route';

// یک کلید ثابت برای همه ادمین‌ها
const ADMIN_PUSH_KEY = process.env.ADMIN_PUSH_KEY || 'ADMIN_SUPPORT';

webpush.setVapidDetails(
  'mailto:admin@yourdomain.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// فقط برای نوتیف: HTML رو به متن ساده تبدیل می‌کنیم
function stripHtml(html = '') {
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  return withoutTags.replace(/\s+/g, ' ').trim();
}

export async function notifyAdminsNewMessage({ sessionId, content, url }) {
  // چون در subscribe برای ادمین‌ها userId = ADMIN_PUSH_KEY می‌فرستیم،
  // کلید map می‌شود: u:ADMIN_SUPPORT
  const key = `u:${ADMIN_PUSH_KEY}`;
  const subs = __getSubscriptionsForKey(key);

  console.log('[notifyAdminsNewMessage] key:', key, 'subs count:', subs.length);

  if (!subs.length) return;

  const plain = stripHtml(content);
  const preview = plain.slice(0, 140) || 'پیام جدیدی از کاربر در پشتیبانی دارید.';

  const payload = JSON.stringify({
    title: 'پیام جدید در پشتیبانی',
    body: preview,
    url, // لینک صفحهٔ پنل ادمین که می‌خوای باز بشه
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, payload);
        console.log('[notifyAdminsNewMessage] sent OK to', sub.endpoint.slice(0, 60), '…');
      } catch (err) {
        console.error(
          '[notifyAdminsNewMessage] webpush error',
          err?.statusCode,
          err?.body || err?.message
        );
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          __removeSubscriptionForKey(key, sub.endpoint);
        }
      }
    })
  );
}