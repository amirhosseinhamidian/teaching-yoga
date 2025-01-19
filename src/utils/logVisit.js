export function logVisit() {
  // دریافت اطلاعات
  const userAgent = navigator.userAgent;
  const pageUrl = window.location.href;
  const referrer = document.referrer;

  // بررسی لوکال‌هاست و مسیر پنل ادمین
  const isLocalHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const isAdminPanel = pageUrl.includes('/a-panel');

  // اگر صفحه مربوط به پنل ادمین باشد یا در حالت لوکال‌هاست باشد، داده‌ها ارسال نشوند
  if (!isLocalHost && !isAdminPanel) {
    // تبدیل داده‌ها به Blob برای ارسال با sendBeacon
    const data = JSON.stringify({ userAgent, pageUrl, referrer });
    const blob = new Blob([data], { type: 'application/json' });

    // ارسال اطلاعات به سرور
    navigator.sendBeacon('/api/visit-log', blob);
  }
}
