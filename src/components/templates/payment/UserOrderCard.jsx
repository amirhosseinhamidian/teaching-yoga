/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

import CoursePaymentItem from './CoursePaymentItem';
import Image from 'next/image';

const isTehranAddress = (addr) => {
  if (!addr) return false;
  const city = String(addr.city || '').trim();
  const province = String(addr.province || '').trim();
  return province.includes('تهران') || city.includes('تهران');
};

const formatToman = (n) => {
  const v = Number(n || 0);
  return v === 0 ? 'رایگان' : v.toLocaleString('fa-IR');
};

export default function UserOrderCard({ data, className, addressId }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuthUser();

  const cart = data?.cart || null; // دوره‌ها
  const shopCart = data?.shopCart || null; // محصولات

  const courseItems = cart?.courses || [];
  const shopItems = shopCart?.items || [];

  const hasCourses = Array.isArray(courseItems) && courseItems.length > 0;
  const hasShop = Array.isArray(shopItems) && shopItems.length > 0;
  const hasAny = hasCourses || hasShop;

  const [roleCheck, setRoleCheck] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // -------- Address (فقط برای تشخیص تهران) --------
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [leadTimeDays, setLeadTimeDays] = useState(1);
  const [leadTimeLoading, setLeadTimeLoading] = useState(false);

  const addressIsTehran = useMemo(
    () => isTehranAddress(selectedAddress),
    [selectedAddress]
  );

  // فقط اگر محصول داریم، با addressId یک بار آدرس را بگیر (برای تشخیص تهران)
  useEffect(() => {
    if (!hasShop) return;

    if (!addressId) {
      setSelectedAddress(null);
      return;
    }

    let ignore = false;
    const ctrl = new AbortController();

    const loadAddress = async () => {
      try {
        setAddressLoading(true);

        // اگر API تک‌آدرس داری بهتره اینو بزنی:
        // GET /api/user/addresses/:id
        // ولی چون ممکنه نداشته باشی، از لیست می‌گیریم:
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const res = await fetch(`${base}/api/user/addresses`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'خطا در دریافت آدرس‌ها');

        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
            ? json.items
            : Array.isArray(json?.data)
              ? json.data
              : [];

        const found =
          list.find((a) => Number(a?.id) === Number(addressId)) || null;

        if (!ignore) setSelectedAddress(found);
      } catch (e) {
        if (e?.name === 'AbortError') return;
        console.error(e);
        if (!ignore) setSelectedAddress(null);
      } finally {
        if (!ignore) setAddressLoading(false);
      }
    };

    loadAddress();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [hasShop, addressId]);

  useEffect(() => {
    if (!hasShop) return;

    let ignore = false;
    const ctrl = new AbortController();

    const fetchLeadTime = async () => {
      try {
        setLeadTimeLoading(true);

        // پیشنهاد: از API عمومی خودت بگیر
        // مثال: GET /api/shop/status => { shopLeadTimeDays: 2, canAccess: true, shopVisibility: "ALL" }
        const res = await fetch('/api/shop/status/lead-time', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: ctrl.signal,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const n = Number(json?.shopLeadTimeDays);
        if (!ignore && Number.isFinite(n) && n >= 0) {
          setLeadTimeDays(Math.trunc(n));
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        console.error(e);
      } finally {
        if (!ignore) setLeadTimeLoading(false);
      }
    };

    fetchLeadTime();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [hasShop]);

  // -------- Shipping (Quote) --------
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]); // [{key,title,amount,logoUrl,etaText}]
  const [shippingSource, setShippingSource] = useState(null); // POSTEX | FALLBACK
  const [shippingNote, setShippingNote] = useState('');
  const [selectedShippingKey, setSelectedShippingKey] = useState(null);

  // POST | COURIER
  const [shippingMethod, setShippingMethod] = useState('POST');

  // ✅ با API جدید: options آماده می‌آیند
  const normalizeOptionsFromApi = (json) => {
    const options = Array.isArray(json?.options) ? json.options : [];
    return options.map((o) => ({
      key: String(o.key),
      title: String(o.title || ''),
      amount: Math.ceil(Number(o.amount || 0) * 1.13),
      etaText: o.etaText ? String(o.etaText) : '—',
      logoUrl: o.logoUrl ? String(o.logoUrl) : null,
    }));
  };

  // اگر آدرس تهران نیست، COURIER را به POST برگردان
  useEffect(() => {
    if (!hasShop) return;
    if (shippingMethod === 'COURIER_COD' && !addressIsTehran) {
      setShippingMethod('POST');
    }
  }, [hasShop, shippingMethod, addressIsTehran]);

  // Quote گرفتن وقتی addressId عوض شد
  useEffect(() => {
    if (!hasShop) return;
    if (!addressId) return;

    let ignore = false;
    const ctrl = new AbortController();

    const fetchQuote = async () => {
      try {
        setShippingLoading(true);
        setShippingNote('');
        setShippingSource(null);

        const res = await fetch('/api/shop/shipping/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: ctrl.signal,
          body: JSON.stringify({ addressId: Number(addressId) }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message || 'خطا در استعلام هزینه ارسال');
        }

        if (ignore) return;

        const options = normalizeOptionsFromApi(json);
        setShippingOptions(options);

        const src = String(json?.source || '').toUpperCase() || null;
        setShippingSource(src);
        setShippingNote(String(json?.note || '') || '');

        // انتخاب پیش‌فرض:
        setSelectedShippingKey((prev) => {
          if (!options.length) return null;
          if (prev && options.some((o) => o.key === prev)) return prev;
          return options[0]?.key ?? null;
        });

        // اگر آدرس تهران نیست، مطمئن شو courier فعال نمی‌مونه
        if (!addressIsTehran && shippingMethod === 'COURIER_COD') {
          setShippingMethod('POST');
        }
      } catch (e) {
        if (e?.name === 'AbortError') return;
        console.error(e);

        if (!ignore) {
          // UI-safe fallback (صرفاً برای اینکه UI خالی نشه)
          const fallback = [
            {
              key: 'FALLBACK_POST_FAST',
              title: 'پست پیشتاز',
              amount: -1,
              logoUrl: '/images/post.jpeg',
              etaText: 'از ۴ تا ۷ روز کاری',
            },
          ];
          setShippingOptions(fallback);
          setShippingSource('FALLBACK');
          setShippingNote(
            'به علت عدم برقراری ارتباط با سامانه پست، هزینه ارسال متعاقبا محاسبه می شود و به اطلاع شما خواهد رسید.'
          );
          setSelectedShippingKey('FALLBACK_POST_FAST');
          if (shippingMethod === 'COURIER_COD' && !addressIsTehran) {
            setShippingMethod('POST');
          }
        }
      } finally {
        if (!ignore) setShippingLoading(false);
      }
    };

    fetchQuote();

    return () => {
      ignore = true;
      ctrl.abort();
    };
  }, [hasShop, addressId]);

  const selectedShipping = useMemo(() => {
    if (!selectedShippingKey) return null;
    return shippingOptions.find((x) => x.key === selectedShippingKey) || null;
  }, [shippingOptions, selectedShippingKey]);

  const shippingCost = useMemo(() => {
    if (!hasShop) return 0;
    if (shippingMethod === 'COURIER_COD') return 0; // هزینه پیک در محل
    return Number(selectedShipping?.amount || 0); // تومان
  }, [hasShop, shippingMethod, selectedShipping]);

  // -------- Amounts --------
  const coursePayable = Number(cart?.totalPrice || 0); // تومان
  const shopPayable = Number(shopCart?.payable ?? shopCart?.subtotal ?? 0); // تومان

  const onlinePayable = useMemo(() => {
    if (!hasAny) return 0;

    // پیک: هزینه ارسال در محل، آنلاین فقط دوره+محصول
    if (hasShop && shippingMethod === 'COURIER_COD') {
      return coursePayable + shopPayable;
    }

    // پست: دوره+محصول+هزینه ارسال
    return (
      coursePayable +
      shopPayable +
      (hasShop && shippingCost >= 0 ? shippingCost : 0)
    );
  }, [
    hasAny,
    hasShop,
    shippingMethod,
    coursePayable,
    shopPayable,
    shippingCost,
  ]);

  if (!hasAny) {
    return (
      <div
        className={`rounded-xl bg-surface-light p-4 dark:bg-surface-dark ${className}`}
      >
        <h2 className='my-6 text-center text-lg'>سبد خرید شما خالی است.</h2>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user?.firstname || !user?.lastname) {
      toast.showErrorToast('لطفا نام و نام خانوادگی خود را ثبت کنید.');
      return;
    }

    if (hasShop) {
      if (!addressId) {
        toast.showErrorToast('لطفاً ابتدا یک آدرس برای ارسال انتخاب کنید.');
        return;
      }

      if (shippingMethod === 'POST' && !selectedShippingKey) {
        toast.showErrorToast('لطفاً سرویس ارسال با پست را انتخاب کنید.');
        return;
      }

      if (shippingMethod === 'COURIER_COD' && !addressIsTehran) {
        toast.showErrorToast('ارسال با پیک فقط برای تهران فعال است.');
        return;
      }
    }

    if (!roleCheck) {
      toast.showErrorToast(
        'برای پرداخت لازم است قوانین و مقررات را تایید کنید.'
      );
      return;
    }

    try {
      setPaymentLoading(true);

      // validate discount (دوره‌ها)
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apply-discount-code`,
        { method: 'PATCH' }
      );

      const payload = {
        cartId: cart?.id || null,
        shopCartId: shopCart?.id || null,

        addressId: hasShop ? Number(addressId) : null,

        shipping: hasShop
          ? {
              method: shippingMethod, // POST | COURIER
              postOptionKey:
                shippingMethod === 'POST' ? selectedShippingKey : null,
              postOptionTitle:
                shippingMethod === 'POST'
                  ? selectedShipping?.title || ''
                  : null,
              shippingCost: shippingMethod === 'POST' ? shippingCost : 0, // تومان
              payShippingAtDestination: shippingMethod === 'COURIER_COD', // فقط هزینه ارسال در محل
              source: shippingSource || null,
            }
          : null,

        amount: onlinePayable, // تومان
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showErrorToast(json?.message || 'خطا در ایجاد پرداخت');
        return;
      }
      if (json?.paymentResponse?.paymentUrl) {
        window.location.href = json.paymentResponse.paymentUrl;
        return;
      }

      if (json?.successUrl) {
        window.location.href = json.successUrl;
        return;
      }

      toast.showErrorToast('پاسخ پرداخت نامعتبر است.');
    } catch (e) {
      console.error(e);
      toast.showErrorToast('خطای ناشناخته در پرداخت');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-4 shadow sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>سفارش شما</h2>

      {/* دوره‌ها */}
      {hasCourses && (
        <>
          <h3 className='mb-3 text-sm font-semibold'>دوره‌ها</h3>
          {courseItems.map((course) => (
            <div key={course.courseId} className='mb-2'>
              <CoursePaymentItem data={course} />
            </div>
          ))}
          <hr className='my-4 border-t border-gray-300 dark:border-gray-700' />
        </>
      )}

      {/* محصولات */}
      {hasShop && (
        <>
          <h3 className='mb-3 text-sm font-semibold'>محصولات</h3>

          {shopItems.map((it) => (
            <div
              key={it.id}
              className='mb-3 flex items-center justify-between gap-2'
            >
              <div className='flex items-center gap-2'>
                <Image
                  src={it.coverImage}
                  alt={it.productTitle}
                  width={280}
                  height={160}
                  className='h-9 w-14 rounded-lg object-cover sm:h-14 sm:w-20'
                />
                <div className='flex flex-col'>
                  <span className='text-sm md:text-base'>
                    {it.productTitle}
                  </span>
                  <span className='text-2xs text-subtext-light md:text-xs dark:text-subtext-dark'>
                    تعداد: {Number(it.qty || 0).toLocaleString('fa-IR')}
                    {it.color?.name ? ` | رنگ: ${it.color.name}` : ''}
                    {it.size?.name ? ` | سایز: ${it.size.name}` : ''}
                  </span>
                </div>
              </div>

              <div className='flex items-baseline gap-1'>
                <span className='font-faNa text-sm font-semibold sm:text-base'>
                  {formatToman(Number(it.unitPrice || 0) * Number(it.qty || 0))}
                </span>
                {Number(it.unitPrice || 0) !== 0 && (
                  <span className='text-2xs'>تومان</span>
                )}
              </div>
            </div>
          ))}

          <hr className='my-4 border-t border-gray-300 dark:border-gray-700' />

          {/* روش ارسال (بدون نمایش آدرس) */}
          <div className='mb-4 rounded-xl border border-foreground-light p-4 dark:border-foreground-dark'>
            <h4 className='mb-3 text-sm font-semibold'>روش ارسال</h4>

            {!addressId ? (
              <div className='text-xs text-red'>
                برای محاسبه هزینه ارسال، ابتدا یک آدرس برای ارسال انتخاب کنید.
              </div>
            ) : addressLoading ? (
              <div className='text-xs text-subtext-light dark:text-subtext-dark'>
                در حال بررسی آدرس...
              </div>
            ) : (
              <>
                {/* انتخاب کلی: POST / COURIER */}
                {addressIsTehran && (
                  <div className='mb-3 flex flex-col gap-2 text-xs'>
                    <label className='flex cursor-pointer items-center gap-2'>
                      <input
                        type='radio'
                        name='shipping'
                        checked={shippingMethod === 'POST'}
                        onChange={() => setShippingMethod('POST')}
                        className='peer hidden'
                      />

                      <span className='flex h-4 w-4 items-center justify-center rounded-full border-2 border-secondary'>
                        <span
                          className={`h-2 w-2 rounded-full bg-secondary transition duration-150 ${
                            shippingMethod === 'POST'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      </span>
                      <span>ارسال با پست (تهران و شهرستان)</span>
                    </label>
                    {/* پیک فقط تهران */}
                    <label className='flex cursor-pointer items-center gap-2'>
                      <input
                        type='radio'
                        name='shipping'
                        checked={shippingMethod === 'COURIER_COD'}
                        onChange={() => setShippingMethod('COURIER_COD')}
                        className='peer hidden'
                      />

                      <span className='flex h-4 w-4 items-center justify-center rounded-full border-2 border-secondary'>
                        <span
                          className={`h-2 w-2 rounded-full bg-secondary transition duration-150 ${
                            shippingMethod === 'COURIER_COD'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      </span>
                      <span>پیک تهران (هزینه ارسال در محل پرداخت می‌شود)</span>
                    </label>

                    <hr className='my-3 border-t border-gray-300 dark:border-gray-700' />
                  </div>
                )}

                <div className='mb-2 rounded-lg bg-black/5 p-2 text-xs text-subtext-light dark:bg-white/5 dark:text-subtext-dark'>
                  {leadTimeLoading ? (
                    <span>در حال دریافت زمان آماده‌سازی سفارش...</span>
                  ) : (
                    <span>
                      زمان آماده‌سازی سفارش:{' '}
                      <span className='font-faNa'>
                        {leadTimeDays.toLocaleString('fa-IR')}
                      </span>{' '}
                      روز کاری
                    </span>
                  )}
                </div>

                {/* اگر POST انتخاب شد، گزینه‌های postex/fallback را نشان بده */}
                {shippingMethod === 'POST' && (
                  <>
                    {shippingLoading ? (
                      <div className='text-xs text-subtext-light dark:text-subtext-dark'>
                        در حال استعلام هزینه ارسال...
                      </div>
                    ) : (
                      <>
                        {!!shippingNote && (
                          <div className='mb-2 rounded-lg bg-black/5 p-2 text-2xs text-subtext-light dark:bg-white/5 dark:text-subtext-dark'>
                            {shippingNote}
                          </div>
                        )}

                        {shippingOptions.length === 0 ? (
                          <div className='text-xs text-red'>
                            گزینه‌ای برای ارسال یافت نشد. لطفاً دوباره تلاش
                            کنید.
                          </div>
                        ) : (
                          <div className='flex flex-col gap-2'>
                            {shippingOptions.map((opt) => (
                              <div
                                key={opt.key}
                                onClick={() => setSelectedShippingKey(opt.key)}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-xs transition duration-200 ${
                                  opt.key === selectedShippingKey
                                    ? 'border-accent bg-accent/5'
                                    : 'border-gray-200 dark:border-foreground-dark'
                                }`}
                              >
                                <div className='flex items-center gap-2'>
                                  <Image
                                    src={opt?.logoUrl || '/images/post.jpeg'}
                                    alt={opt.title}
                                    width={32}
                                    height={32}
                                    className='h-8 w-8 rounded-md bg-white object-contain'
                                  />

                                  <div className='flex flex-col'>
                                    <span className='font-semibold'>
                                      {opt.title}
                                    </span>
                                    <span className='font-faNa text-2xs text-subtext-light dark:text-subtext-dark'>
                                      {opt.etaText || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className='flex items-baseline gap-1'>
                                  <span className='font-faNa text-xs font-bold sm:text-sm'>
                                    {opt.amount < 0
                                      ? 'بعداً محاسبه می‌شود'
                                      : formatToman(opt.amount)}
                                  </span>
                                  {Number(opt.amount || 0) > 0 && (
                                    <span className='text-2xs'>تومان</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {/* اگر COURIER انتخاب شد */}
                {shippingMethod === 'COURIER_COD' && (
                  <div className='mt-2 rounded-lg bg-black/5 p-3 text-2xs text-subtext-light dark:bg-white/5 dark:text-subtext-dark'>
                    هزینه ارسال توسط پیک در محل دریافت می‌شود.
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* جمع‌بندی */}
      <div className='rounded-xl border border-foreground-light p-4 dark:border-foreground-dark'>
        {hasCourses && (
          <div className='mb-2 flex justify-between text-sm'>
            <span>مبلغ دوره‌ها</span>
            <span className='font-faNa text-xs sm:text-sm'>
              {formatToman(coursePayable)} {coursePayable !== 0 && 'تومان'}
            </span>
          </div>
        )}

        {hasShop && (
          <>
            <div className='mb-2 flex justify-between text-sm'>
              <span>مبلغ محصولات</span>
              <span className='font-faNa text-xs sm:text-sm'>
                {formatToman(shopPayable)} {shopPayable !== 0 && 'تومان'}
              </span>
            </div>

            {shippingMethod === 'POST' && !!addressId && (
              <div className='mb-2 flex justify-between text-sm'>
                <span>هزینه ارسال</span>
                <span className='font-faNa text-xs sm:text-sm'>
                  {shippingCost < 0
                    ? 'بعداً محاسبه می‌شود'
                    : `${formatToman(shippingCost)}${shippingCost > 0 ? ' تومان' : ''}`}
                </span>
              </div>
            )}

            {shippingMethod === 'COURIER_COD' && (
              <div className='mb-2 flex justify-between text-sm'>
                <span>هزینه ارسال (پرداخت در محل)</span>
                <span className='font-faNa text-xs sm:text-sm'>در محل</span>
              </div>
            )}
          </>
        )}

        <hr className='my-3 border-gray-300 dark:border-gray-700' />

        <div className='flex justify-between gap-3 text-base font-bold text-green-light sm:text-lg md:text-base xl:text-lg dark:text-green-dark'>
          <span>مبلغ قابل پرداخت</span>
          <span className='font-faNa'>
            {formatToman(onlinePayable)} {onlinePayable !== 0 && 'تومان'}
          </span>
        </div>
      </div>

      <Checkbox
        label={
          <span className='text-[8px] text-subtext-light md:text-2xs dark:text-subtext-dark'>
            من{' '}
            <Link href='/rules' className='text-blue'>
              شرایط و مقررات
            </Link>{' '}
            سایت را خوانده‌ام و آن را می‌پذیرم.
          </span>
        }
        checked={roleCheck}
        onChange={setRoleCheck}
        color='secondary'
        size='small'
      />

      <div className='flex w-full justify-center'>
        <Button
          shadow
          isLoading={paymentLoading}
          disable={addressLoading}
          onClick={handlePayment}
          className='mt-6 w-full sm:w-2/3 lg:w-1/2'
        >
          {onlinePayable === 0 ? 'ثبت سفارش' : 'پرداخت'}
        </Button>
      </div>
    </div>
  );
}

UserOrderCard.propTypes = {
  data: PropTypes.shape({
    cart: PropTypes.any,
    shopCart: PropTypes.any,
  }),
  className: PropTypes.string,

  // ✅ فقط آیدی آدرس منتخب از والد
  addressId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
