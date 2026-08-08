/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { getShamsiDate } from '@/utils/dateTimeHelper';

import {
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineReceiptPercent,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

async function fetchUserPayment() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/payment`,
      {
        cache: 'no-store',
        method: 'GET',
      }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch payment data: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

const purchaseTypeMap = {
  COURSE: {
    label: 'دوره',
    cls: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  },
  SUBSCRIPTION: {
    label: 'اشتراک',
    cls: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
  SHOP: {
    label: 'فروشگاه',
    cls: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  },
  MIXED: {
    label: 'ترکیبی',
    cls: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300',
  },
  UNKNOWN: {
    label: 'نامشخص',
    cls: 'border-black/10 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark',
  },
};

const paymentStatusMap = {
  PENDING: {
    label: 'در انتظار تکمیل',
    cls: 'border-yellow/20 bg-yellow/10 text-yellow',
  },
  SUCCESSFUL: {
    label: 'تکمیل‌شده',
    cls: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
  FAILED: {
    label: 'ناموفق',
    cls: 'border-red/20 bg-red/10 text-red',
  },
};

const paymentMethodMap = {
  CREDIT_CARD: {
    label: 'کارت به کارت',
    cls: 'border-blue/20 bg-blue/10 text-blue',
  },
  FREE: {
    label: 'بدون پرداخت',
    cls: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300',
  },
  ONLINE: {
    label: 'آنلاین',
    cls: 'border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300',
  },
};

function groupItems(items = []) {
  const g = { SUBSCRIPTION: [], COURSE: [], PRODUCT: [] };
  for (const it of items || []) {
    const title = it?.title || '—';
    if (it?.type === 'SUBSCRIPTION') g.SUBSCRIPTION.push(title);
    else if (it?.type === 'COURSE') g.COURSE.push(title);
    else if (it?.type === 'PRODUCT') g.PRODUCT.push(title);
  }
  return g;
}

function renderItems(items = []) {
  if (!items?.length) return 'نامشخص';

  const g = groupItems(items);
  const lines = [];

  if (g.SUBSCRIPTION.length) {
    lines.push(`اشتراک: ${g.SUBSCRIPTION.join('، ')}`);
  }

  if (g.COURSE.length) {
    lines.push(
      g.COURSE.length > 1
        ? `دوره‌ها:\n${g.COURSE.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        : `دوره: ${g.COURSE[0]}`
    );
  }

  if (g.PRODUCT.length) {
    lines.push(
      g.PRODUCT.length > 1
        ? `محصولات:\n${g.PRODUCT.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        : `محصول: ${g.PRODUCT[0]}`
    );
  }

  return <div className='whitespace-pre-wrap'>{lines.join('\n')}</div>;
}

const SectionPaymentOrder = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getUserPayment = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserPayment();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error in getUserPayment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getUserPayment();
  }, []);

  if (isLoading) {
    return (
      <div className='flex min-h-[360px] w-full flex-col items-center justify-center gap-3'>
        <AiOutlineLoading3Quarters
          size={34}
          className='animate-spin text-secondary'
        />
        <span className='text-xs text-subtext-light dark:text-subtext-dark'>
          در حال دریافت سوابق پرداخت...
        </span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        className='px-5 py-14 text-center'
      >
        <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
          <HiOutlineReceiptPercent size={30} />
        </span>
        <h3 className='mt-4 text-sm font-black text-text-light dark:text-text-dark'>
          هنوز پرداختی ثبت نشده است
        </h3>
        <p className='mx-auto mt-2 max-w-sm text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
          سوابق پرداخت دوره‌ها، اشتراک‌ها و خریدهای فروشگاه در این بخش نمایش
          داده می‌شود.
        </p>
      </SiteCard>
    );
  }

  return (
    <div className='space-y-3'>
      {payments.map((payment, index) => {
        const purchaseType =
          purchaseTypeMap[payment.purchaseType] || purchaseTypeMap.UNKNOWN;

        const status = paymentStatusMap[payment.status] || {
          label: 'نامشخص',
          cls: 'border-black/10 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark',
        };

        const method = paymentMethodMap[payment.method] || {
          label: 'نامشخص',
          cls: 'border-black/10 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark',
        };

        const amount = Number(payment.amountToman || 0);

        return (
          <SiteCard
            key={payment.id || `${payment.transactionId}-${index}`}
            variant='glass'
            padding='none'
            radius='md'
            className='relative overflow-hidden p-4 sm:p-5'
          >
            <div
              aria-hidden='true'
              className='absolute -left-20 -top-20 h-40 w-40 rounded-full bg-secondary/[0.06] blur-[65px]'
            />

            <div className='relative z-10'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span
                      className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${purchaseType.cls}`}
                    >
                      {purchaseType.label}
                    </span>

                    <span
                      className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${status.cls}`}
                    >
                      {status.label}
                    </span>

                    <span
                      className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${method.cls}`}
                    >
                      {method.label}
                    </span>
                  </div>

                  <div className='mt-3 flex items-center gap-2 text-[10px] text-subtext-light dark:text-subtext-dark'>
                    <HiOutlineCalendarDays
                      size={15}
                      className='text-secondary'
                    />
                    <span className='font-faNa'>
                      {getShamsiDate(payment.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className='shrink-0 rounded-2xl border border-black/5 bg-background-light/45 px-4 py-3 text-left dark:border-white/10 dark:bg-background-dark/30'>
                  <p className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                    مبلغ پرداخت
                  </p>
                  <p className='mt-1 font-faNa text-base font-black text-secondary'>
                    {amount === 0 ? 'رایگان' : amount.toLocaleString('fa-IR')}
                  </p>
                  {amount > 0 && (
                    <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  )}
                </div>
              </div>

              <div className='mt-4 grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] dark:border-white/10'>
                <div className='flex items-start gap-3'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                    <HiOutlineShoppingBag size={18} />
                  </span>

                  <div className='min-w-0 text-[10px] leading-6 text-text-light sm:text-xs dark:text-text-dark'>
                    {renderItems(payment.items)}
                  </div>
                </div>

                <div className='flex items-center gap-2 sm:justify-end'>
                  <HiOutlineCreditCard size={16} className='text-secondary' />
                  <span className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                    شماره تراکنش:
                  </span>
                  <span className='font-faNa text-[10px] font-black text-text-light dark:text-text-dark'>
                    {payment.transactionId === '0'
                      ? '-'
                      : payment.transactionId}
                  </span>
                </div>
              </div>
            </div>
          </SiteCard>
        );
      })}

      <div className='flex items-start gap-2 rounded-2xl bg-background-light/35 px-3 py-2.5 text-[9px] leading-5 text-subtext-light dark:bg-background-dark/25 dark:text-subtext-dark'>
        <HiOutlineBanknotes
          size={15}
          className='mt-0.5 shrink-0 text-secondary'
        />
        <span>
          این بخش سوابق پرداخت ثبت‌شده در حساب کاربری شما را نمایش می‌دهد.
        </span>
      </div>
    </div>
  );
};

export default SectionPaymentOrder;
