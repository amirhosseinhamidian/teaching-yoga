/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import OrderHeaderActions from './OrderHeaderActions';
import OrderDetailsBody from './OrderDetailsBody';
import AdminReturnRequestsCard from './AdminReturnRequestsCard';

// اگر تو پروژه‌ات toast handler داری، اینو فعال کن:
// import { createToastHandler } from '@/utils/toastHandler';
// import { useTheme } from '@/contexts/ThemeContext';

export default function OrderDetailsClient({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [saving, setSaving] = useState(false);

  // اگر toast داری:
  // const { isDark } = useTheme();
  // const toast = createToastHandler(isDark);

  const refresh = async () => {
    const res = await fetch(`/api/admin/shop/orders/${order.id}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json?.order) setOrder(json.order);
  };

  const updateOrder = async (patch) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shop/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Update failed');
      setOrder(json.order);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(
    () => ({
      items: Array.isArray(order?.items) ? order.items.length : 0,
    }),
    [order]
  );

  return (
    <div className='space-y-4'>
      <OrderHeaderActions
        order={order}
        saving={saving}
        onSave={updateOrder}
        onRefresh={refresh}
      />

      <OrderDetailsBody order={order} />

      <AdminReturnRequestsCard
        orderId={order.id}
        returnRequests={order.returnRequests}
        onRefresh={refresh} // ✅ همین
        // toast={toast} // ✅ اگر toast ساختی اینو باز کن
      />
    </div>
  );
}

OrderDetailsClient.propTypes = {
  initialOrder: PropTypes.object.isRequired,
};
