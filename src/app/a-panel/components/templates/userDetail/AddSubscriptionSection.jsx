/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { ImSpinner2 } from 'react-icons/im';
import AddUserSubscriptionModal from '../../modules/AddUserSubscriptionModal/AddUserSubscriptionModal';
import Modal from '@/components/modules/Modal/Modal';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { HiOutlineBan } from 'react-icons/hi';
import { LuTrash } from 'react-icons/lu';

function toFaDate(d) {
  try {
    return new Date(d).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}

function diffDays(endDate) {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

function toFaMoney(n) {
  const num = Number(n || 0);
  return num.toLocaleString('fa-IR');
}

function paymentMethodFa(method) {
  console.log(method);
  const map = {
    CREDIT_CARD: 'کارت به کارت',
    ONLINE: 'پرداخت آنلاین',
    FREE: 'رایگان',
  };

  return map[method] || '—';
}

export default function AddSubscriptionSection({
  userId,
  username,
  className,
}) {
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchSubs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}/subscriptions`,
        { method: 'GET', cache: 'no-store' }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'خطا در دریافت تاریخچه اشتراک‌ها');
        setSubs([]);
        return;
      }

      setSubs(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setError('خطا در ارتباط با سرور');
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    fetchSubs();
  }, [username]);

  const activeSub = useMemo(() => {
    const now = Date.now();
    return subs.find((s) => {
      const end = new Date(s.endDate).getTime();
      return s.status === 'ACTIVE' && end >= now;
    });
  }, [subs]);

  const doCancel = async (subscriptionId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CANCEL_NOW' }), // یا SET_INACTIVE
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'خطا در لغو اشتراک');
      await fetchSubs();
    } catch (e) {
      setError(e.message);
    }
  };

  const doDelete = async (subscriptionId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}/subscriptions/${subscriptionId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'خطا در حذف اشتراک');
      await fetchSubs();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className={className}>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold'>مدیریت اشتراک</h3>
          {activeSub ? (
            <p className='text-green-light dark:text-green-dark mt-1 font-faNa text-xs'>
              اشتراک فعال دارد (تا {toFaDate(activeSub.endDate)} |{' '}
              {diffDays(activeSub.endDate)} روز باقی مانده)
            </p>
          ) : (
            <p className='mt-1 text-xs text-red'>اشتراک فعال ندارد</p>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <Button shadow onClick={fetchSubs} className='text-xs sm:text-sm'>
            بروزرسانی لیست
          </Button>
          <Button
            shadow
            onClick={() => setShowModal(true)}
            className='text-xs sm:text-sm'
          >
            فعال‌سازی دستی اشتراک
          </Button>
        </div>
      </div>

      <div className='mt-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
        {loading ? (
          <div className='flex items-center justify-center gap-2 py-8 text-sm'>
            <ImSpinner2 className='animate-spin text-secondary' size={18} />
            در حال دریافت تاریخچه اشتراک‌ها...
          </div>
        ) : error ? (
          <div className='text-sm text-red'>{error}</div>
        ) : subs.length === 0 ? (
          <div className='text-sm text-subtext-light dark:text-subtext-dark'>
            هنوز هیچ اشتراکی برای این کاربر ثبت نشده است.
          </div>
        ) : (
          <div className='space-y-3'>
            {subs.map((s) => {
              const amountPaid = s?.meta?.amountPaid ?? null;
              const method = s?.meta?.paymentMethod ?? null;
              const source = s?.meta?.source ?? null;

              const isActiveNow =
                s.status === 'ACTIVE' &&
                new Date(s.endDate).getTime() >= Date.now();

              const isCanceled = s.status === 'CANCELED';

              const badge = isActiveNow
                ? {
                    text: 'فعال',
                    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-200',
                  }
                : isCanceled
                  ? {
                      text: 'لغو شده',
                      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-200',
                    }
                  : {
                      text: 'پایان یافته',
                      cls: 'bg-rose-100 text-red dark:bg-rose-200',
                    };
              // ✅ plan اینجا تاریخچه‌ایه (از snapshot) — اگر نبود fallback
              const plan = s.plan || null;

              const basePrice = Number(plan?.price ?? 0);
              const discountAmount = Number(plan?.discountAmount ?? 0);

              // اگر finalPrice نیومده بود، خودمون حساب می‌کنیم
              const finalPrice =
                plan?.finalPrice != null
                  ? Number(plan.finalPrice)
                  : Math.max(0, basePrice - discountAmount);

              const capturedAt = plan?.capturedAt || null;
              const hasSnapshot = !!s.hasSnapshot || !!capturedAt;

              return (
                <div
                  key={s.id}
                  className='flex flex-col gap-2 rounded-xl bg-background-light p-3 dark:bg-background-dark'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold'>
                        {plan?.name || `Plan #${s.planId}`}
                      </p>

                      <p className='mt-1 text-xs text-slate-600 dark:text-slate-300'>
                        شروع: {toFaDate(s.startDate)} • پایان:{' '}
                        {toFaDate(s.endDate)}
                      </p>

                      {hasSnapshot && (
                        <p className='mt-1 text-[10px] text-slate-500 dark:text-slate-400'>
                          قیمت‌ها براساس اطلاعات زمان خرید نمایش داده می‌شوند
                          {capturedAt ? ` • ثبت: ${toFaDate(capturedAt)}` : ''}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${badge.cls}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {/* ✅ قیمت‌ها تفکیکی */}
                  <div className='grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-3 dark:text-slate-200'>
                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        قیمت پایه:{' '}
                      </span>
                      {toFaMoney(basePrice)} تومان
                    </div>

                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        تخفیف:{' '}
                      </span>
                      {discountAmount > 0 ? (
                        <span className='text-red'>
                          {toFaMoney(discountAmount)} تومان
                        </span>
                      ) : (
                        '—'
                      )}
                    </div>

                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        قیمت نهایی:{' '}
                      </span>
                      <span className='text-green-light dark:text-green-dark'>
                        {toFaMoney(finalPrice)}
                      </span>{' '}
                      تومان
                    </div>
                  </div>

                  <div className='grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-3 dark:text-slate-200'>
                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        گزارش پرداخت:{' '}
                      </span>
                      {amountPaid == null
                        ? '—'
                        : `${toFaMoney(amountPaid)} تومان`}
                    </div>

                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        روش/منبع:{' '}
                      </span>
                      {method ? (paymentMethodFa(method) ?? '—') : '—'}
                      {source
                        ? ` / ${source === 'ADMIN' ? 'ادمین' : 'کاربر'}`
                        : ''}
                    </div>

                    <div>
                      <span className='text-slate-500 dark:text-slate-400'>
                        دوره:{' '}
                      </span>
                      {plan?.intervalLabel || '—'}
                    </div>
                  </div>

                  <div className='mt-2 flex justify-end gap-2'>
                    <ActionButtonIcon
                      icon={HiOutlineBan}
                      color='secondary'
                      size={16}
                      onClick={() =>
                        setConfirmAction({
                          type: 'cancel',
                          subscriptionId: s.id,
                          planName: s.plan?.name,
                        })
                      }
                    />

                    <ActionButtonIcon
                      icon={LuTrash}
                      color='red'
                      size={16}
                      onClick={() =>
                        setConfirmAction({
                          type: 'delete',
                          subscriptionId: s.id,
                          planName: s.plan?.name,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddUserSubscriptionModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSubs();
          }}
        />
      )}
      {confirmAction && (
        <Modal
          title={confirmAction.type === 'cancel' ? 'لغو اشتراک' : 'حذف اشتراک'}
          desc={
            confirmAction.type === 'cancel'
              ? `آیا مطمئنی اشتراک "${confirmAction.planName || ''}" همین الان لغو شود؟`
              : `آیا مطمئنی اشتراک "${confirmAction.planName || ''}" حذف شود؟ این عمل قابل بازگشت نیست.`
          }
          primaryButtonText='خیر'
          secondaryButtonText={
            confirmAction.type === 'cancel' ? 'بله، لغو اشتراک' : 'بله، حذف'
          }
          icon={confirmAction.type === 'cancel' ? HiOutlineBan : LuTrash}
          iconSize={36}
          primaryButtonClick={() => setConfirmAction(null)}
          secondaryButtonClick={async () => {
            const id = confirmAction.subscriptionId;
            const type = confirmAction.type;
            setConfirmAction(null);

            if (type === 'cancel') await doCancel(id);
            else await doDelete(id);
          }}
        />
      )}
    </div>
  );
}

AddSubscriptionSection.propTypes = {
  userId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  className: PropTypes.string,
};
