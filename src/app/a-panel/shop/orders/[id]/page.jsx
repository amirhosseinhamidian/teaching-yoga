/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';
import { headers } from 'next/headers';
import OrderDetailsClient from '@/app/a-panel/components/templates/shop/orders/details/OrderDetailsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchOrder(id) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/orders/${id}`,
    {
      method: 'GET',
      headers: headers(),
      cache: 'no-store',
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || 'Fetch order error');
  console.log('order ======> ', json.order);

  return json?.order;
}

export default async function AdminOrderDetailPage({ params }) {
  const order = await fetchOrder(params?.id);
  return <OrderDetailsClient initialOrder={order} />;
}
