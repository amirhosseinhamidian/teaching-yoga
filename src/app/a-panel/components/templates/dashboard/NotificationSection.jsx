 'use client';
import React, { useState } from 'react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const ADMIN_PUSH_KEY = process.env.NEXT_PUBLIC_ADMIN_PUSH_KEY || 'ADMIN_SUPPORT';

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array(0);
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationSection = () => {
  const { notifications } = useNotifications();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isSubscribing, setIsSubscribing] = useState(false);

  async function enableAdminPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.showErrorToast('مرورگر شما از اعلان‌های وب پشتیبانی نمی‌کند.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast.showErrorToast('برای دریافت اعلان، اجازهٔ نمایش نوتیف لازم است.');
      return;
    }

    setIsSubscribing(true);
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/push/subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userId: ADMIN_PUSH_KEY, // 👈 کلید ثابت ادمین‌ها
            anonymousId: null,
          }),
        }
      );

      if (!res.ok) throw new Error('subscribe failed');
      toast.showSuccessToast('اعلان پیام‌های جدید برای ادمین فعال شد ✅');
    } catch (err) {
      console.error('[ADMIN_PUSH_ERROR]', err);
      toast.showErrorToast('فعالسازی اعلان با خطا مواجه شد.');
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4 dark:bg-surface-dark">
      <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
        اعلان‌ها
      </div>

      {/* لیست اعلان‌ها */}
      {notifications.details?.map((notification, index) => (
        <div key={index}>
          {notification.count !== 0 && (
            <NotificationItem
              count={notification.count}
              text={notification.text}
              path={notification.actionPath}
            />
          )}
        </div>
      ))}

      {/* دکمه فعال‌سازی اعلان */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40">
        <div className="text-xs text-gray-600 dark:text-gray-300">
          با فعال‌سازی اعلان، هنگام دریافت پیام جدید و سوالات از کاربران نوتیف دریافت می‌کنید.
        </div>
        <button
          type="button"
          disabled={isSubscribing}
          onClick={enableAdminPush}
          className="rounded-md bg-green px-3 py-1.5 text-xs font-medium text-white hover:bg-green/90 cursor-pointer disabled:opacity-60"
        >
          {isSubscribing ? 'در حال فعال‌سازی…' : 'فعالسازی اعلان'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSection;
