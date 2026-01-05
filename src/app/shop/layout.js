// app/shop/layout.js
import { getShopEnabled } from '@/utils/server/shopGuard';
import { redirect } from 'next/navigation';

export default async function ShopLayout({ children }) {
  const enabled = await getShopEnabled();

  if (!enabled) {
    redirect('/'); // فروشگاه خاموش → کاربر بره صفحه اصلی
  }

  return children;
}
