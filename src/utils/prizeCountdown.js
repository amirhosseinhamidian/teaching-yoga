export const prizeCountdown = () => {
  const now = new Date();
  const endOfDay = new Date(now);

  // تنظیم زمان به پایان روز (23:59:59)
  endOfDay.setHours(23, 59, 59, 999);

  // محاسبه تفاوت زمانی بر حسب میلی‌ثانیه
  const timeRemaining = endOfDay - now;

  if (timeRemaining <= 0) {
    return '00:00:00'; // اگر زمان پایان روز رسیده باشد
  }

  // تبدیل به ساعت، دقیقه و ثانیه
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  // تبدیل به فرمت دو رقمی
  const formatNumber = (num) => String(num).padStart(2, '0');

  return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
};
