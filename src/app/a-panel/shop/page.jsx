'use client';

import React, { useEffect, useState } from 'react';
import HeadAction from '../components/templates/shop/HeadAction';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

import OrderSummarySection from '../components/templates/shop/dashboard/OrderSummarySection';
import ProductSummarySection from '../components/templates/shop/dashboard/ProductSummarySection';
import ShippingSummarySection from '../components/templates/shop/dashboard/ShippingSummarySection';
import ShopSalesSummarySection from '../components/templates/shop/dashboard/ShopSalesSummarySection';

import Link from 'next/link';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import ShopSettingsModal from '../components/templates/shop/dashboard/ShopSettingsModal';

export default function AdminShopDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [shopSettings, setShopSettings] = useState(null);

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  async function fetchDashboard() {
    setLoadingDashboard(true);
    try {
      const res = await fetch('/api/admin/shop/dashboard', {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.showErrorToast(
          data?.error || 'خطا در دریافت اطلاعات داشبورد فروشگاه'
        );
        return;
      }

      setDashboard(data);
    } catch (e) {
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function fetchShopSettings() {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/shop/settings', {
        cache: 'no-store',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در دریافت تنظیمات فروشگاه');
        return;
      }

      // ✅ این مهمه: داخل state ذخیره بشه
      setShopSettings(data);
    } catch (e) {
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setLoadingSettings(false);
    }
  }

  // ✅ ذخیره تنظیمات: endpoint درست + method درست
  // (طبق API که دادی: PATCH /api/admin/shop/settings)
  const saveSettings = async (payload) => {
    const res = await fetch('/api/admin/shop/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.showErrorToast(data?.error || 'خطا در ذخیره تنظیمات فروشگاه');
      throw new Error(data?.error || 'Save failed');
    }

    setShopSettings(data);
  };

  useEffect(() => {
    fetchShopSettings();
    fetchDashboard();
  }, []);

  const loading = loadingSettings || loadingDashboard;

  return (
    <div className='p-4'>
      {loading ? (
        <div className='text-sm'>در حال دریافت اطلاعات...</div>
      ) : (
        <div className='space-y-6 p-4'>
          <HeadAction onOpenSettings={() => setShowSettings(true)} />

          <div className='my-4 flex flex-wrap gap-3'>
            <Link href='/a-panel/shop/products'>
              <OutlineButton
                color='subtext'
                className='text-xs xs:text-sm md:text-base'
              >
                محصولات
              </OutlineButton>
            </Link>

            <Link href='/a-panel/shop/categories'>
              <OutlineButton
                color='subtext'
                className='text-xs xs:text-sm md:text-base'
              >
                دسته بندی ها
              </OutlineButton>
            </Link>

            <Link href='/a-panel/shop/orders'>
              <OutlineButton
                color='subtext'
                className='text-xs xs:text-sm md:text-base'
              >
                سفارش ها
              </OutlineButton>
            </Link>
          </div>

          <OrderSummarySection
            info={dashboard?.orders || {}}
            isLoading={loadingDashboard}
          />

          <ProductSummarySection
            info={dashboard?.products || {}}
            isLoading={loadingDashboard}
          />

          <ShippingSummarySection
            info={dashboard?.shipping || {}}
            isLoading={loadingDashboard}
          />

          <ShopSalesSummarySection
            info={dashboard?.sales || {}}
            isLoading={loadingDashboard}
          />
        </div>
      )}

      {/* ✅ Settings Modal */}
      {showSettings && shopSettings && (
        <ShopSettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
          initialData={shopSettings}
          onSave={saveSettings}
        />
      )}
    </div>
  );
}
