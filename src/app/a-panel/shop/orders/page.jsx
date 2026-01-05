/* eslint-disable no-undef */
import React from 'react';
import AdminOrdersHeader from '../../components/templates/shop/orders/AdminOrdersHeader';
import AdminOrdersTableSection from '../../components/templates/shop/orders/AdminOrdersTableSection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminShopOrdersPage() {
  return (
    <div className='w-full'>
      <h1 className='mb-4 text-base font-semibold lg:text-lg'>
        سفارش‌های فروشگاه
      </h1>

      {/* ✅ Component 1: Header (Filters + Counts cards) */}
      <AdminOrdersHeader />

      {/* ✅ Component 2: Table + Pagination */}
      <AdminOrdersTableSection />
    </div>
  );
}
