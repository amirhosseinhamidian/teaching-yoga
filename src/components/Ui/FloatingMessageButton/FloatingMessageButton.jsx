/* eslint-disable no-undef */
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdMessage, MdSend } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { ImSpinner2 } from 'react-icons/im';
import IconButton from '../ButtonIcon/ButtonIcon';
import Input from '../Input/Input';
import UserMessage from './UserMessage';
import SupportMessage from './SupportMessage';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useSession } from 'next-auth/react';
import { getAnonymousId } from '@/utils/localStorageHelper';
import { BiSupport } from 'react-icons/bi';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; // Base64 URL-safe

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String?.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// تشخیص ساده مرورگر و سیستم‌عامل برای راهنمایی
function detectEnvHint() {
  if (typeof navigator === 'undefined') return '';

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMac = /Macintosh|Mac OS X/.test(ua) && !isIOS;
  const isWindows = /Windows/.test(ua);
  const isLinux = /Linux/.test(ua) && !isAndroid;

  let browser = 'مرورگر';
  if (/Chrome\/|CriOS/.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edg\//.test(ua)) browser = 'Microsoft Edge';

  if (isIOS) {
    return `در iPhone یا iPad به Settings → Notifications برو، ${browser} را پیدا کن و Allow Notifications را فعال کن. 
سپس داخل ${browser}، روی آیکون "Aa" کنار آدرس بزن، Website Settings را باز کن و Notifications را روی Allow بگذار.`;
  }

  if (isAndroid) {
    return `در Android معمولاً از Settings → Apps → ${browser} → Notifications می‌توانی نوتیف‌ها را فعال کنی. 
همچنین داخل ${browser} روی آیکون قفل کنار آدرس بزن و Notifications را برای این سایت روی Allow قرار بده.`;
  }

  if (isMac) {
    return `در macOS از System Settings → Notifications، ${browser} را انتخاب کن و Allow Notifications را فعال کن. 
بعد داخل ${browser}، روی آیکون قفل کنار آدرس بزن و Notifications را برای این سایت روی Allow قرار بده.`;
  }

  if (isWindows || isLinux) {
    return `در تنظیمات سیستم (Notifications) مطمئن شو نوتیف برای ${browser} فعال است. 
سپس داخل ${browser} روی آیکون قفل کنار آدرس یا بخش Site settings برو و Notifications را برای این سایت روی Allow بگذار.`;
  }

  return 'از تنظیمات مرورگر، بخش Site settings یا آیکون قفل کنار آدرس، Notifications را برای این سایت روی Allow قرار بده. اگر باز هم نوتیف نمی‌بینی، تنظیمات اعلان سیستم‌عامل را هم بررسی کن.';
}

export default function FloatingMessageButton() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Push Notifications
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [envHint, setEnvHint] = useState('');

  const containerRef = useRef(null);

  const isNotifCTAVisible = useMemo(() => {
    if (!messages?.length) return false;
    const last = messages[messages.length - 1];
    return last?.sender === 'USER' && notifPermission !== 'granted';
  }, [messages, notifPermission]);

  const toggleMessage = () => setOpen((p) => !p);

  const fetchMessages = async (requestedPage = 1, appendToTop = false) => {
    try {
      if (requestedPage === 1) setIsLoadingInitial(true);
      else setIsFetchingMore(true);

      const anonymousId = getAnonymousId();
      const params = new URLSearchParams();
      if (anonymousId) params.append('anonymousId', anonymousId);
      params.append('page', String(requestedPage));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/support-message?${params.toString()}`
      );

      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();

      if (requestedPage === 1) {
        setMessages(data.messages || []);
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 60);
      } else if (appendToTop) {
        setMessages((prev) => [...(data.messages || []), ...prev]);
      }

      setPage(requestedPage);
      setHasMore(requestedPage < (data.totalPages || 1));
    } catch (e) {
      toast.showErrorToast('خطا در دریافت پیام‌ها');
    } finally {
      setIsLoadingInitial(false);
      setIsFetchingMore(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      const payload = { content: message.trim() };
      if (!session?.user?.userId) payload.anonymousId = getAnonymousId();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/support-message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error('send failed');
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setMessage('');
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 40);
    } catch (e) {
      toast.showErrorToast('خطا در ارسال پیام');
    } finally {
      setIsSending(false);
    }
  };

  // Init (open/close)
  useEffect(() => {
    if (open) {
      setPage(1);
      setHasMore(true);
      fetchMessages(1);
    }
    const handleEsc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Infinite scroll (older)
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const el = containerRef.current;
    const onScroll = () => {
      if (el.scrollTop < 20 && hasMore && !isFetchingMore) {
        const prevH = el.scrollHeight;
        fetchMessages(page + 1, true).then(() => {
          const newH = el.scrollHeight;
          el.scrollTop = newH - prevH;
        });
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, hasMore, isFetchingMore]);

  // Push support + existing subscription + env hint
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setPushSupported(supported);
    if (!supported) {
      setEnvHint(detectEnvHint());
      return;
    }

    setNotifPermission(Notification.permission);
    setEnvHint(detectEnvHint());

    (async () => {
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration()) ||
          (await navigator.serviceWorker.register('/sw.js'));
        const sub = await reg.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch {
        // ignore
      }
    })();
  }, []);

  const requestAndSubscribe = async () => {
    if (!pushSupported)
      return toast.showErrorToast('مرورگر شما از اعلان‌های وب پشتیبانی نمی‌کند.');
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== 'granted') {
        toast.showErrorToast('برای دریافت اعلان، اجازهٔ نمایش نوتیف لازم است.');
        return;
      }

      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register('/sw.js'));

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const body = {
        subscription,
        userId: session?.user?.userId || null,
        anonymousId: session?.user?.userId ? null : getAnonymousId(),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/push/subscribe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error('subscribe failed');

      setPushEnabled(true);
      toast.showSuccessToast('اعلان پاسخ فعال شد');
    } catch (e) {
      console.error(e);
      toast.showErrorToast('فعالسازی اعلان با خطا مواجه شد.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={toggleMessage}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-text-light shadow-lg transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14"
        aria-label={open ? 'بستن چت' : 'باز کردن چت'}
      >
        {open ? <IoClose size={28} /> : <MdMessage size={28} />}
      </button>

      {/* Chat Box */}
      {open && (
        <div className="fixed bottom-[82px] left-6 z-50 flex max-h-[78vh] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_20px_60px_rgba(0,0,0,.15)] backdrop-blur-md dark:bg-[#0b0f14] md:bottom-[88px]">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-black/5 p-3.5 dark:border-white/10">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-4 ring-primary/10">
                <BiSupport className="h-7 w-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">پشتیبانی آنلاین</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  معمولاً چند دقیقه
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="بستن"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={containerRef}
            className="scroll-smooth flex-1 space-y-2 overflow-y-auto bg-[linear-gradient(180deg,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.02)_100%)] p-3 text-sm"
          >
            {isLoadingInitial ? (
              <div className="flex h-48 items-center justify-center">
                <ImSpinner2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : messages.length > 0 ? (
              <>
                {isFetchingMore && (
                  <div className="sticky top-0 z-10 mx-auto my-1 w-max rounded-full bg-black/5 px-3 py-1 text-[11px] text-gray-600 backdrop-blur dark:bg-white/10 dark:text-gray-300">
                    در حال دریافت پیام‌های قدیمی‌تر…
                  </div>
                )}

                {messages.map((msg) =>
                  msg.sender === 'USER' ? (
                    <UserMessage key={msg.id} content={msg.content} />
                  ) : (
                    <SupportMessage key={msg.id} content={msg.content} />
                  )
                )}

                {/* CTA: Enable Web Push under last user message */}
                {isNotifCTAVisible && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-2.5 text-[13px] leading-6 dark:border-amber-400/30 dark:bg-[#2a2207] dark:text-amber-100">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                    <div className="flex-1">
                      برای اینکه وقتی پشتیبان پاسخ داد خبرت کنیم، <b>اعلان مرورگر</b> را فعال کن.
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={requestAndSubscribe}
                            disabled={subscribing || pushEnabled}
                            className="rounded-md bg-green px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
                          >
                            {pushEnabled
                              ? 'فعال است'
                              : subscribing
                              ? 'در حال فعال‌سازی…'
                              : 'فعالسازی اعلان پاسخ'}
                          </button>
                        </div>
                        {notifPermission === 'denied' && (
                          <span className="mt-1 text-[11px] text-red-600 dark:text-red-400 whitespace-pre-line">
                            دسترسی نوتیف در مرورگر مسدود است.
                            {'\n'}
                            {envHint}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <p>هنوز گفت‌وگویی آغاز نشده!</p>
                <p className="mt-1">می‌تونی سوالاتی مثل این‌ها بپرسی:</p>
                <ul className="mt-2 list-inside list-disc text-right">
                  <li>دوره مناسب سطح من چیه؟</li>
                  <li>آیا تمرینات برای بارداری مناسبه؟</li>
                  <li>چطور به ویدیوهای خریداری‌شده دسترسی پیدا کنم؟</li>
                  <li>مشکل در پرداخت دارم</li>
                </ul>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-black/5 p-2.5 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={message}
                onChange={setMessage}
                fullWidth
                onEnterPress={handleSend}
                placeholder="پیام خود را بنویسید…"
                className="flex-1 rounded-xl border-none bg-black/5 px-3 py-2 text-sm focus:outline-none dark:bg-white/10"
              />
              <IconButton
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                loading={isSending}
                className="rotate-180 rounded-xl px-3 py-2 hover:bg-primary/90 disabled:opacity-50"
                icon={MdSend}
              />
            </div>

            {notifPermission !== 'granted' && !isNotifCTAVisible && (
              <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 whitespace-pre-line">
                بعد از ارسال پیام، نوتیفیکیشن را جهت اطلاع رسانی فعال کنید.
                {notifPermission === 'denied' && (
                  <>
                    {'\n'}
                    {envHint}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
