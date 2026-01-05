/* eslint-disable no-undef */
'use client';

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

const toFaNumber = (n) => Number(n || 0).toLocaleString('fa-IR');

const formatToman = (n) => `${toFaNumber(n)} تومان`;

const formatDateFa = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const humanizeShippingMethod = (m) => {
  const v = String(m || '').toUpperCase();
  if (v === 'POST') return 'پست';
  if (v === 'COURIER_COD') return 'پیک (پرداخت در محل)';
  return m || '—';
};

const ColorDot = ({ hex }) => {
  const bg = hex && /^#([0-9A-F]{3}){1,2}$/i.test(hex) ? hex : '#999999';
  return (
    <span
      className='inline-block h-3 w-3 rounded-full ring-1 ring-black/10'
      style={{ background: bg }}
    />
  );
};

ColorDot.propTypes = { hex: PropTypes.string };

export default function OrderDetailsBody({ order }) {
  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order]
  );

  const user = order?.user || null;
  const payment = order?.payment || null;

  return (
    <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
      {/* left: info */}
      <div className='space-y-4 lg:col-span-1'>
        {/* customer */}
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <h3 className='mb-3 text-sm font-semibold'>اطلاعات مشتری</h3>

          <div className='space-y-2 text-xs'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>نام</span>
              <span className='text-right'>
                {order?.fullName ||
                  `${user?.firstname || ''} ${user?.lastname || ''}`.trim() ||
                  '—'}
              </span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>موبایل</span>
              <span className='font-faNa'>
                {order?.phone || user?.phone || '—'}
              </span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                نام کاربری
              </span>
              <span>{user?.username || '—'}</span>
            </div>
          </div>
        </div>

        {/* shipping */}
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <h3 className='mb-3 text-sm font-semibold'>ارسال و آدرس</h3>

          <div className='space-y-2 text-xs'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                روش ارسال
              </span>
              <span>
                {order?.shippingTitle ||
                  humanizeShippingMethod(order?.shippingMethod)}
              </span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                هزینه ارسال
              </span>
              {order?.shippingMethod === 'POST' ? (
                <span className='font-faNa'>
                  {order?.postOptionKey === 'FALLBACK_POST_FAST' &&
                  order?.shippingCost === 0 ? (
                    <span className='text-red'>
                      هزینه ارسال باید محاسبه شود.
                    </span>
                  ) : order?.shippingCost === 0 ? (
                    'رایگان'
                  ) : (
                    formatToman(order?.shippingCost)
                  )}
                </span>
              ) : (
                <span>در محل</span>
              )}
            </div>

            <div className='flex items-start justify-between gap-2'>
              <span className='pt-0.5 text-slate-500 dark:text-slate-300'>
                آدرس
              </span>
              <span className='text-right leading-relaxed'>
                {order?.province || '—'}، {order?.city || '—'}،{' '}
                {order?.address1 || '—'}
              </span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>کدپستی</span>
              <span className='font-faNa'>{order?.postalCode || '—'}</span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                تاریخ تحویل
              </span>
              <span className='font-faNa'>
                {formatDateFa(order?.deliveryDate)}
              </span>
            </div>

            {order?.trackingCode && (
              <div className='flex items-center justify-between gap-2'>
                <span className='text-slate-500 dark:text-slate-300'>
                  کد رهگیری
                </span>
                <span className='font-faNa'>{order.trackingCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* payment */}
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <h3 className='mb-3 text-sm font-semibold'>پرداخت</h3>

          <div className='space-y-2 text-xs'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                مبلغ پرداختی
              </span>
              <span className='font-faNa'>
                {payment?.amount
                  ? `${toFaNumber(Math.ceil(Number(payment.amount) / 10))} تومان`
                  : '—'}
              </span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                کد پرداختی
              </span>
              <span className='font-faNa'>{payment?.transactionId || '—'}</span>
            </div>

            <div className='flex items-center justify-between gap-2'>
              <span className='text-slate-500 dark:text-slate-300'>
                زمان پرداخت
              </span>
              <span className='font-faNa'>
                {formatDateFa(payment?.updatedAt || payment?.createAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* right: items */}
      <div className='lg:col-span-2'>
        <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>اقلام سفارش</h3>
            <div className='text-xs text-slate-500 dark:text-slate-300'>
              تعداد آیتم‌ها:{' '}
              <span className='font-faNa'>{toFaNumber(items.length)}</span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className='py-10 text-center text-sm text-slate-500 dark:text-slate-300'>
              آیتمی وجود ندارد.
            </div>
          ) : (
            <div className='space-y-3'>
              {items.map((it) => {
                const qty = Number(it.qty || 1);
                const unit = Number(it.unitPrice || 0);
                const sum = unit * qty;

                return (
                  <div
                    key={it.id}
                    className='flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700'
                  >
                    <div className='flex items-center gap-3'>
                      <Image
                        src={it.coverImage || '/images/no-image.png'}
                        alt={it.title || 'product'}
                        width={96}
                        height={72}
                        className='h-16 w-20 rounded-lg object-cover'
                      />

                      <div className='flex flex-col gap-1'>
                        <div className='text-sm font-semibold'>
                          {it.title || '—'}
                        </div>

                        <div className='flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300'>
                          <span>
                            تعداد:{' '}
                            <span className='font-faNa'>{toFaNumber(qty)}</span>
                          </span>

                          {/* color */}
                          {it?.color ? (
                            <span className='inline-flex items-center gap-1'>
                              رنگ:
                              <ColorDot hex={it.color.hex} />
                              <span>{it.color.name}</span>
                            </span>
                          ) : it?.colorId ? (
                            <span>رنگ: #{toFaNumber(it.colorId)}</span>
                          ) : null}

                          {/* size */}
                          {it?.size ? (
                            <span>
                              سایز:{' '}
                              <span className='font-faNa'>{it.size.name}</span>
                            </span>
                          ) : it?.sizeId ? (
                            <span>سایز: #{toFaNumber(it.sizeId)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-col items-end gap-1 text-xs'>
                      <div className='text-slate-500 dark:text-slate-300'>
                        قیمت واحد
                      </div>
                      <div className='font-faNa font-semibold'>
                        {formatToman(unit)}
                      </div>

                      {qty > 1 && (
                        <div className='text-[11px] text-slate-500 dark:text-slate-300'>
                          جمع:{' '}
                          <span className='font-faNa'>{formatToman(sum)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* totals */}
              <div className='mt-4 rounded-xl bg-gray-50 p-3 text-xs dark:bg-foreground-dark/30'>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div className='flex items-center gap-10'>
                    <span className='text-slate-500 dark:text-slate-300'>
                      جمع کالاها
                    </span>
                    <span className='font-faNa font-semibold'>
                      {formatToman(order?.subtotal)}
                    </span>
                  </div>

                  <div className='flex items-center gap-14'>
                    <span className='text-slate-500 dark:text-slate-300'>
                      تخفیف
                    </span>
                    <span className='font-faNa font-semibold'>
                      {formatToman(order?.discountAmount)}
                    </span>
                  </div>

                  <div className='flex items-center gap-8'>
                    <span className='text-slate-500 dark:text-slate-300'>
                      هزینه ارسال
                    </span>
                    <span className='font-faNa font-semibold'>
                      {formatToman(order?.shippingCost)}
                    </span>
                  </div>

                  <div className='flex items-center gap-9'>
                    <span className='text-slate-500 dark:text-slate-300'>
                      مبلغ نهایی
                    </span>
                    <span className='font-faNa font-semibold'>
                      {formatToman(order?.payableOnline)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Return requests placeholder (اگر داری) */}
        {/* اگر مدل returnRequests رو اضافه کردی، اینجا یک کارت جدا می‌ذاریم و approve/reject هم می‌ذاریم */}
      </div>
    </div>
  );
}

OrderDetailsBody.propTypes = {
  order: PropTypes.object.isRequired,
};
