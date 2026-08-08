/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';

import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { reportClientError } from '@/utils/reportClientError';

import CoursePaymentItem from './CoursePaymentItem';

import {
  HiOutlineAcademicCap,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineReceiptPercent,
  HiOutlineShoppingBag,
  HiOutlineTruck,
} from 'react-icons/hi2';

const isTehranAddress = (address) => {
  if (!address) return false;

  const city = String(address.city || '').trim();
  const province = String(address.province || '').trim();

  return province.includes('تهران') || city.includes('تهران');
};

const formatToman = (value) => {
  const number = Number(value || 0);
  return number === 0 ? 'رایگان' : number.toLocaleString('fa-IR');
};

const normalizeOptionsFromApi = (json) => {
  const options = Array.isArray(json?.options) ? json.options : [];

  return options.map((option) => ({
    key: String(option.key),
    title: String(option.title || ''),
    amount: Math.ceil(Number(option.amount || 0) * 1.13),
    etaText: option.etaText ? String(option.etaText) : '—',
    logoUrl: option.logoUrl ? String(option.logoUrl) : null,
  }));
};

function ProductPaymentImage({ src, alt }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className='relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-background-light/55 dark:border-white/10 dark:bg-background-dark/35'>
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt || 'تصویر محصول'}
          fill
          sizes='80px'
          className='object-cover'
          onError={() => setImageError(true)}
        />
      ) : (
        <HiOutlinePhoto size={22} className='text-secondary/40' />
      )}
    </div>
  );
}

ProductPaymentImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
};

export default function UserOrderCard({ data, className, addressId }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuthUser();

  const cart = data?.cart || null;
  const shopCart = data?.shopCart || null;

  const courseItems = cart?.courses || [];
  const shopItems = shopCart?.items || [];

  const hasCourses = Array.isArray(courseItems) && courseItems.length > 0;
  const hasShop = Array.isArray(shopItems) && shopItems.length > 0;
  const hasAny = hasCourses || hasShop;

  /* --------------------------------------------------------------------------
   * State
   * ----------------------------------------------------------------------- */

  const [roleCheck, setRoleCheck] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [leadTimeDays, setLeadTimeDays] = useState(1);
  const [leadTimeLoading, setLeadTimeLoading] = useState(false);

  // IMPORTANT: shippingMethod must be initialized BEFORE any effect/memo uses it.
  // This fixes: ReferenceError: Cannot access 'shippingMethod' before initialization
  const [shippingMethod, setShippingMethod] = useState('POST');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingSource, setShippingSource] = useState(null);
  const [shippingNote, setShippingNote] = useState('');
  const [selectedShippingKey, setSelectedShippingKey] = useState(null);

  const addressIsTehran = useMemo(
    () => isTehranAddress(selectedAddress),
    [selectedAddress]
  );

  /* --------------------------------------------------------------------------
   * Keep floating chat above the mobile payment bar
   * ----------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasAny) return undefined;

    document.body.classList.add('has-mobile-checkout-bar');

    return () => {
      document.body.classList.remove('has-mobile-checkout-bar');
    };
  }, [hasAny]);

  /* --------------------------------------------------------------------------
   * Address
   * ----------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasShop) return undefined;

    if (!addressId) {
      setSelectedAddress(null);
      return undefined;
    }

    let ignore = false;
    const controller = new AbortController();

    const loadAddress = async () => {
      try {
        setAddressLoading(true);

        const res = await fetch('/api/user/addresses', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
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
          list.find((item) => Number(item?.id) === Number(addressId)) || null;

        if (!ignore) setSelectedAddress(found);
      } catch (error) {
        if (error?.name === 'AbortError') return;

        reportClientError(error, {
          event: 'checkout_address_load_failed',
          component: 'UserOrderCard',
          severity: 'warn',
          data: {
            operation: 'load_checkout_address',
            hasAddressId: Boolean(addressId),
          },
        });

        if (!ignore) setSelectedAddress(null);
      } finally {
        if (!ignore) setAddressLoading(false);
      }
    };

    loadAddress();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hasShop, addressId]);

  /* --------------------------------------------------------------------------
   * Lead time
   * ----------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasShop) return undefined;

    let ignore = false;
    const controller = new AbortController();

    const fetchLeadTime = async () => {
      try {
        setLeadTimeLoading(true);

        const res = await fetch('/api/shop/status/lead-time', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;

        const number = Number(json?.shopLeadTimeDays);
        if (!ignore && Number.isFinite(number) && number >= 0) {
          setLeadTimeDays(Math.trunc(number));
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;

        reportClientError(error, {
          event: 'checkout_lead_time_load_failed',
          component: 'UserOrderCard',
          severity: 'warn',
          data: {
            operation: 'load_shop_lead_time',
          },
        });
      } finally {
        if (!ignore) setLeadTimeLoading(false);
      }
    };

    fetchLeadTime();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hasShop]);

  /* --------------------------------------------------------------------------
   * Shipping
   * ----------------------------------------------------------------------- */

  useEffect(() => {
    if (!hasShop) return;

    if (shippingMethod === 'COURIER_COD' && !addressIsTehran) {
      setShippingMethod('POST');
    }
  }, [hasShop, shippingMethod, addressIsTehran]);

  useEffect(() => {
    if (!hasShop || !addressId) return undefined;

    let ignore = false;
    const controller = new AbortController();

    const fetchQuote = async () => {
      try {
        setShippingLoading(true);
        setShippingNote('');
        setShippingSource(null);

        const res = await fetch('/api/shop/shipping/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({ addressId: Number(addressId) }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message || 'خطا در استعلام هزینه ارسال');
        }

        if (ignore) return;

        const options = normalizeOptionsFromApi(json);
        setShippingOptions(options);

        const source = String(json?.source || '').toUpperCase() || null;
        setShippingSource(source);
        setShippingNote(String(json?.note || '') || '');

        setSelectedShippingKey((previousKey) => {
          if (!options.length) return null;
          if (
            previousKey &&
            options.some((option) => option.key === previousKey)
          ) {
            return previousKey;
          }
          return options[0]?.key ?? null;
        });
      } catch (error) {
        if (error?.name === 'AbortError') return;

        reportClientError(error, {
          event: 'checkout_shipping_quote_failed',
          component: 'UserOrderCard',
          severity: 'warn',
          data: {
            operation: 'load_shipping_quote',
            hasAddressId: Boolean(addressId),
          },
        });

        if (!ignore) {
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
        }
      } finally {
        if (!ignore) setShippingLoading(false);
      }
    };

    fetchQuote();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hasShop, addressId]);

  const selectedShipping = useMemo(() => {
    if (!selectedShippingKey) return null;

    return (
      shippingOptions.find((item) => item.key === selectedShippingKey) || null
    );
  }, [shippingOptions, selectedShippingKey]);

  const shippingCost = useMemo(() => {
    if (!hasShop) return 0;
    if (shippingMethod === 'COURIER_COD') return 0;

    return Number(selectedShipping?.amount || 0);
  }, [hasShop, shippingMethod, selectedShipping]);

  /* --------------------------------------------------------------------------
   * Amounts
   * ----------------------------------------------------------------------- */

  const coursePayable = Number(cart?.totalPrice || 0);
  const shopPayable = Number(shopCart?.payable ?? shopCart?.subtotal ?? 0);

  const onlinePayable = useMemo(() => {
    if (!hasAny) return 0;

    if (hasShop && shippingMethod === 'COURIER_COD') {
      return coursePayable + shopPayable;
    }

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

  /* --------------------------------------------------------------------------
   * Payment
   * ----------------------------------------------------------------------- */

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

      let discountResponse;

      try {
        discountResponse = await fetch('/api/apply-discount-code', {
          method: 'PATCH',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });
      } catch (error) {
        reportClientError(error, {
          event: 'checkout_discount_refresh_network_failed',
          component: 'UserOrderCard',
          data: {
            operation: 'refresh_discount',
          },
        });

        toast.showErrorToast('بررسی تخفیف با مشکل مواجه شد.');
        return;
      }

      const discountData = await discountResponse.json().catch(() => null);

      if (!discountResponse.ok) {
        if (discountResponse.status >= 500) {
          reportClientError(new Error('Discount reservation refresh failed'), {
            event: 'checkout_discount_refresh_failed',
            component: 'UserOrderCard',
            data: {
              status: discountResponse.status,
            },
          });
        }

        toast.showErrorToast(
          discountData?.message || 'بررسی کد تخفیف ناموفق بود.'
        );
        return;
      }

      const payload = {
        cartId: cart?.id || null,
        shopCartId: shopCart?.id || null,
        addressId: hasShop ? Number(addressId) : null,
        shipping: hasShop
          ? {
              method: shippingMethod,
              postOptionKey:
                shippingMethod === 'POST' ? selectedShippingKey : null,
            }
          : null,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.success) {
        if (response.status >= 500) {
          reportClientError(new Error('Checkout API returned a server error'), {
            event: 'checkout_api_failed',
            component: 'UserOrderCard',
            data: {
              status: response.status,
              hasCourses,
              hasShop,
              shippingMethod: hasShop ? shippingMethod : null,
            },
          });
        }

        toast.showErrorToast(
          responseData?.error || responseData?.message || 'خطا در ایجاد پرداخت'
        );
        return;
      }

      if (
        typeof responseData.redirectUrl === 'string' &&
        responseData.redirectUrl
      ) {
        window.location.assign(responseData.redirectUrl);
        return;
      }

      reportClientError(
        new Error('Checkout response did not contain redirectUrl'),
        {
          event: 'checkout_response_invalid',
          component: 'UserOrderCard',
          data: {
            hasPaymentId: Number.isInteger(responseData?.paymentId),
          },
        }
      );

      toast.showErrorToast('پاسخ پرداخت معتبر نیست.');
    } catch (error) {
      reportClientError(error, {
        event: 'checkout_network_failed',
        component: 'UserOrderCard',
        data: {
          operation: 'initialize_checkout',
          hasCourses,
          hasShop,
        },
      });

      toast.showErrorToast('ارتباط با سرور پرداخت برقرار نشد.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!hasAny) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className={`p-6 text-center ${className || ''}`}
      >
        <HiOutlineShoppingBag size={30} className='mx-auto text-secondary/40' />
        <h2 className='mt-3 text-sm font-black text-text-light dark:text-text-dark'>
          سبد خرید شما خالی است
        </h2>
      </SiteCard>
    );
  }

  const paymentButtonText = onlinePayable === 0 ? 'ثبت سفارش' : 'ادامه پرداخت';

  return (
    <>
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className={`relative overflow-hidden ${className || ''}`}
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
        />

        <div className='relative z-10'>
          <div className='flex items-center gap-3 border-b border-black/5 px-5 py-5 sm:px-6 dark:border-white/10'>
            <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineReceiptPercent size={23} />
            </span>

            <div>
              <p className='text-[9px] font-bold text-secondary sm:text-[10px]'>
                مرور نهایی
              </p>
              <h2 className='mt-0.5 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
                سفارش شما
              </h2>
            </div>
          </div>

          <div className='space-y-6 p-5 sm:p-6'>
            {hasCourses && (
              <section>
                <div className='mb-1 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <HiOutlineAcademicCap
                      size={18}
                      className='text-secondary'
                    />
                    <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                      دوره‌ها
                    </h3>
                  </div>

                  <SiteBadge variant='secondary' size='sm'>
                    {courseItems.length.toLocaleString('fa-IR')} دوره
                  </SiteBadge>
                </div>

                <div className='divide-y divide-black/5 dark:divide-white/10'>
                  {courseItems.map((course) => (
                    <CoursePaymentItem key={course.courseId} data={course} />
                  ))}
                </div>
              </section>
            )}

            {hasShop && (
              <section
                className={
                  hasCourses
                    ? 'border-t border-black/5 pt-6 dark:border-white/10'
                    : ''
                }
              >
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-2'>
                    <HiOutlineShoppingBag
                      size={18}
                      className='text-secondary'
                    />
                    <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                      محصولات
                    </h3>
                  </div>

                  <SiteBadge variant='secondary' size='sm'>
                    {shopItems
                      .reduce((sum, item) => sum + Number(item.qty || 0), 0)
                      .toLocaleString('fa-IR')}{' '}
                    محصول
                  </SiteBadge>
                </div>

                <div className='divide-y divide-black/5 dark:divide-white/10'>
                  {shopItems.map((item) => {
                    const lineTotal =
                      Number(item.unitPrice || 0) * Number(item.qty || 0);

                    return (
                      <article
                        key={item.id}
                        className='flex items-center justify-between gap-3 py-3.5'
                      >
                        <div className='flex min-w-0 items-center gap-3'>
                          <ProductPaymentImage
                            src={item.coverImage}
                            alt={item.productTitle}
                          />

                          <div className='min-w-0'>
                            <h4 className='line-clamp-2 text-xs font-black leading-6 text-text-light sm:text-sm dark:text-text-dark'>
                              {item.productTitle}
                            </h4>

                            <div className='mt-1.5 flex flex-wrap gap-1'>
                              <span className='rounded-lg bg-secondary/5 px-2 py-1 font-faNa text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                تعداد:{' '}
                                {Number(item.qty || 0).toLocaleString('fa-IR')}
                              </span>

                              {item.color?.name && (
                                <span className='flex items-center gap-1 rounded-lg bg-secondary/5 px-2 py-1 text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                  {item.color.hex && (
                                    <span
                                      className='h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/20'
                                      style={{
                                        backgroundColor: item.color.hex,
                                      }}
                                    />
                                  )}
                                  {item.color.name}
                                </span>
                              )}

                              {item.size?.name && (
                                <span className='rounded-lg bg-secondary/5 px-2 py-1 font-faNa text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                  سایز: {item.size.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='shrink-0 text-left'>
                          <strong className='font-faNa text-sm font-black sm:text-base'>
                            {formatToman(lineTotal)}
                          </strong>
                          {lineTotal !== 0 && (
                            <span className='mr-1 text-[8px] text-subtext-light dark:text-subtext-dark'>
                              تومان
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {hasShop && (
              <section className='border-t border-black/5 pt-6 dark:border-white/10'>
                <div className='mb-4 flex items-center gap-2'>
                  <HiOutlineTruck size={19} className='text-secondary' />
                  <div>
                    <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                      روش ارسال
                    </h3>
                    <p className='mt-0.5 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      روش مناسب ارسال سفارش را انتخاب کنید
                    </p>
                  </div>
                </div>

                {!addressId ? (
                  <div className='flex items-start gap-2 rounded-2xl border border-red/15 bg-red/5 p-3 text-[10px] leading-6 text-red'>
                    <HiOutlineMapPin size={17} className='mt-0.5 shrink-0' />
                    برای محاسبه هزینه ارسال، ابتدا یک آدرس برای ارسال انتخاب
                    کنید.
                  </div>
                ) : addressLoading ? (
                  <div className='rounded-2xl bg-background-light/45 p-4 text-xs text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
                    در حال بررسی آدرس...
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {addressIsTehran && (
                      <div className='grid gap-2'>
                        <button
                          type='button'
                          onClick={() => setShippingMethod('POST')}
                          className={`flex items-start gap-3 rounded-[18px] border p-3 text-right transition-all ${
                            shippingMethod === 'POST'
                              ? 'border-secondary bg-secondary/[0.06]'
                              : 'border-black/5 bg-background-light/35 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/25'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              shippingMethod === 'POST'
                                ? 'border-secondary bg-secondary'
                                : 'border-black/15 dark:border-white/20'
                            }`}
                          >
                            {shippingMethod === 'POST' && (
                              <HiOutlineCheck
                                size={12}
                                className='text-white'
                              />
                            )}
                          </span>

                          <span>
                            <strong className='block text-xs font-black text-text-light dark:text-text-dark'>
                              ارسال با پست
                            </strong>
                            <span className='mt-0.5 block text-[9px] leading-5 text-subtext-light dark:text-subtext-dark'>
                              مناسب تهران و شهرستان
                            </span>
                          </span>
                        </button>

                        <button
                          type='button'
                          onClick={() => setShippingMethod('COURIER_COD')}
                          className={`flex items-start gap-3 rounded-[18px] border p-3 text-right transition-all ${
                            shippingMethod === 'COURIER_COD'
                              ? 'border-secondary bg-secondary/[0.06]'
                              : 'border-black/5 bg-background-light/35 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/25'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              shippingMethod === 'COURIER_COD'
                                ? 'border-secondary bg-secondary'
                                : 'border-black/15 dark:border-white/20'
                            }`}
                          >
                            {shippingMethod === 'COURIER_COD' && (
                              <HiOutlineCheck
                                size={12}
                                className='text-white'
                              />
                            )}
                          </span>

                          <span>
                            <strong className='block text-xs font-black text-text-light dark:text-text-dark'>
                              پیک تهران
                            </strong>
                            <span className='mt-0.5 block text-[9px] leading-5 text-subtext-light dark:text-subtext-dark'>
                              هزینه ارسال هنگام دریافت پرداخت می‌شود
                            </span>
                          </span>
                        </button>
                      </div>
                    )}

                    <div className='flex items-center gap-2 rounded-2xl bg-background-light/45 p-3 text-[10px] text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
                      <HiOutlineClock
                        size={17}
                        className='shrink-0 text-secondary'
                      />
                      {leadTimeLoading ? (
                        <span>در حال دریافت زمان آماده‌سازی سفارش...</span>
                      ) : (
                        <span>
                          زمان آماده‌سازی سفارش:{' '}
                          <strong className='font-faNa text-text-light dark:text-text-dark'>
                            {leadTimeDays.toLocaleString('fa-IR')}
                          </strong>{' '}
                          روز کاری
                        </span>
                      )}
                    </div>

                    {shippingMethod === 'POST' && (
                      <>
                        {shippingLoading ? (
                          <div className='rounded-2xl bg-background-light/45 p-4 text-xs text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
                            در حال استعلام هزینه ارسال...
                          </div>
                        ) : (
                          <>
                            {shippingNote && (
                              <div className='border-yellow/15 bg-yellow/5 rounded-2xl border p-3 text-[9px] leading-5 text-subtext-light dark:text-subtext-dark'>
                                <div className='mb-1 flex items-center gap-2'>
                                  {shippingSource === 'FALLBACK' && (
                                    <SiteBadge variant='yellow' size='sm'>
                                      هزینه موقت
                                    </SiteBadge>
                                  )}
                                </div>
                                {shippingNote}
                              </div>
                            )}

                            {shippingOptions.length === 0 ? (
                              <div className='rounded-2xl border border-red/15 bg-red/5 p-3 text-[10px] text-red'>
                                گزینه‌ای برای ارسال یافت نشد. لطفاً دوباره تلاش
                                کنید.
                              </div>
                            ) : (
                              <div className='space-y-2'>
                                {shippingOptions.map((option) => {
                                  const active =
                                    option.key === selectedShippingKey;

                                  return (
                                    <button
                                      key={option.key}
                                      type='button'
                                      onClick={() =>
                                        setSelectedShippingKey(option.key)
                                      }
                                      className={`flex w-full items-center justify-between gap-3 rounded-[18px] border p-3 text-right transition-all ${
                                        active
                                          ? 'border-secondary bg-secondary/[0.06]'
                                          : 'border-black/5 bg-background-light/35 hover:border-secondary/20 dark:border-white/10 dark:bg-background-dark/25'
                                      }`}
                                    >
                                      <div className='flex min-w-0 items-center gap-3'>
                                        <span
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                            active
                                              ? 'border-secondary bg-secondary'
                                              : 'border-black/15 dark:border-white/20'
                                          }`}
                                        >
                                          {active && (
                                            <HiOutlineCheck
                                              size={12}
                                              className='text-white'
                                            />
                                          )}
                                        </span>

                                        <Image
                                          src={'/images/post.jpeg'}
                                          alt={option.title}
                                          width={36}
                                          height={36}
                                          className='h-9 w-9 shrink-0 rounded-xl bg-white object-contain p-1'
                                        />

                                        <div className='min-w-0'>
                                          <strong className='block truncate text-xs font-black text-text-light dark:text-text-dark'>
                                            {option.title}
                                          </strong>
                                          <span className='mt-0.5 block font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                                            {option.etaText || '—'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className='shrink-0 text-left'>
                                        <strong className='font-faNa text-xs font-black'>
                                          {option.amount < 0
                                            ? 'بعداً محاسبه می‌شود'
                                            : formatToman(option.amount)}
                                        </strong>
                                        {Number(option.amount || 0) > 0 && (
                                          <span className='mr-1 text-[8px] text-subtext-light dark:text-subtext-dark'>
                                            تومان
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {shippingMethod === 'COURIER_COD' && (
                      <div className='rounded-2xl border border-secondary/10 bg-secondary/5 p-3 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
                        هزینه ارسال توسط پیک در محل دریافت می‌شود و در مبلغ
                        پرداخت آنلاین لحاظ نخواهد شد.
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <section className='border-t border-black/5 pt-6 dark:border-white/10'>
              <div className='relative overflow-hidden rounded-[22px] border border-secondary/15 bg-secondary/[0.055] p-4 dark:bg-secondary/[0.08]'>
                <HiOutlineCreditCard
                  size={86}
                  className='pointer-events-none absolute -bottom-5 -left-4 text-secondary/[0.05]'
                />

                <div className='relative z-10 space-y-3'>
                  {hasCourses && (
                    <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                      <span>مبلغ دوره‌ها</span>
                      <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                        {formatToman(coursePayable)}{' '}
                        {coursePayable !== 0 && 'تومان'}
                      </span>
                    </div>
                  )}

                  {hasShop && (
                    <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                      <span>مبلغ محصولات</span>
                      <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                        {formatToman(shopPayable)}{' '}
                        {shopPayable !== 0 && 'تومان'}
                      </span>
                    </div>
                  )}

                  {hasShop && shippingMethod === 'POST' && addressId && (
                    <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                      <span>هزینه ارسال</span>
                      <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                        {shippingCost < 0
                          ? 'بعداً محاسبه می‌شود'
                          : `${formatToman(shippingCost)}${shippingCost > 0 ? ' تومان' : ''}`}
                      </span>
                    </div>
                  )}

                  {hasShop && shippingMethod === 'COURIER_COD' && (
                    <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                      <span>هزینه ارسال</span>
                      <span className='font-bold text-text-light dark:text-text-dark'>
                        پرداخت در محل
                      </span>
                    </div>
                  )}

                  <div className='h-px bg-secondary/15' />

                  <div className='flex items-end justify-between gap-3'>
                    <span className='text-xs font-black text-text-light dark:text-text-dark'>
                      مبلغ قابل پرداخت
                    </span>
                    <div className='flex items-baseline gap-1'>
                      <strong className='font-faNa text-lg font-black'>
                        {formatToman(onlinePayable)}
                      </strong>
                      {onlinePayable !== 0 && (
                        <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                          تومان
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className='rounded-2xl border border-black/5 bg-background-light/40 p-3 dark:border-white/10 dark:bg-background-dark/25'>
              <Checkbox
                label={
                  <span className='text-[9px] leading-6 text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    من{' '}
                    <Link
                      href='/rules'
                      className='font-bold text-secondary hover:underline'
                    >
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
            </div>

            <SiteButton
              type='button'
              variant='primary'
              size='lg'
              disabled={addressLoading || paymentLoading}
              onClick={handlePayment}
              className='hidden w-full lg:flex'
            >
              {paymentLoading ? 'در حال انتقال...' : paymentButtonText}
            </SiteButton>
          </div>
        </div>
      </SiteCard>

      {/* Mobile fixed payment bar */}
      <div
        dir='rtl'
        data-mobile-checkout-bar='true'
        className='fixed inset-x-0 bottom-0 z-40 lg:hidden'
      >
        <div className='pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background-light/75 to-transparent dark:from-background-dark/75' />

        <div className='bg-surface-light/92 dark:bg-surface-dark/92 border-t border-black/5 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:shadow-[0_-16px_50px_rgba(0,0,0,0.32)]'>
          <div className='mx-auto flex max-w-screen-md items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <span className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                مبلغ قابل پرداخت
              </span>
              <div className='mt-1 flex items-baseline gap-1'>
                <strong className='font-faNa text-lg font-black leading-none text-secondary sm:text-xl'>
                  {formatToman(onlinePayable)}
                </strong>
                {onlinePayable !== 0 && (
                  <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                    تومان
                  </span>
                )}
              </div>
            </div>

            <SiteButton
              type='button'
              variant='primary'
              size='md'
              disabled={addressLoading || paymentLoading}
              onClick={handlePayment}
              className='min-w-[165px] shrink-0 sm:min-w-[210px]'
            >
              {paymentLoading ? 'در حال انتقال...' : paymentButtonText}
            </SiteButton>
          </div>
        </div>
      </div>
    </>
  );
}

UserOrderCard.propTypes = {
  data: PropTypes.shape({
    cart: PropTypes.any,
    shopCart: PropTypes.any,
  }),
  className: PropTypes.string,
  addressId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
