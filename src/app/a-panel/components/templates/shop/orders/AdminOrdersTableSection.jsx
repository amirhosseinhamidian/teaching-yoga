/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AdminOrdersTable from './AdminOrdersTable';

function buildQS(current, patch) {
  const sp = new URLSearchParams(current.toString());
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') sp.delete(k);
    else sp.set(k, String(v));
  });
  return sp.toString();
}

export default function AdminOrdersTableSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(
    () => Math.max(1, Number(searchParams.get('page') || 1)),
    [searchParams]
  );
  const pageSize = useMemo(
    () =>
      Math.min(50, Math.max(10, Number(searchParams.get('pageSize') || 10))),
    [searchParams]
  );

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(Number(total || 0) / pageSize));
  }, [total, pageSize]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = searchParams.toString();
      const res = await fetch(`/api/admin/shop/orders?${qs}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'خطا در دریافت سفارش‌ها');

      setOrders(Array.isArray(json?.orders) ? json.orders : []);
      setTotal(Number(json?.total || 0));
    } catch (e) {
      console.error(e);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [searchParams]);

  const onPageChange = (newPage) => {
    const p = Math.max(1, Math.min(Number(newPage || 1), totalPages));
    const qs = buildQS(searchParams, { page: p });
    router.replace(`${pathname}?${qs}`);
  };

  return (
    <div className='rounded-2xl bg-surface-light p-4 dark:bg-surface-dark'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='text-sm font-semibold'>لیست سفارش‌ها</div>
        <div className='text-xs text-subtext-light dark:text-subtext-dark'>
          تعداد نتایج:{' '}
          <span className='font-faNa font-semibold'>
            {Number(total).toLocaleString('fa-IR')}
          </span>
        </div>
      </div>

      <AdminOrdersTable
        orders={orders}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        isLoading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
