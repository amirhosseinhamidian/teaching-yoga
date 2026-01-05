import prismadb from '@/libs/prismadb';
import { getAuthUser } from '../getAuthUser';

export async function getShopEnabled() {
  const site = await prismadb.siteInfo.findFirst({
    select: {
      shopVisibility: true,
    },
  });

  const visibility = site?.shopVisibility ?? 'ALL';

  // فروشگاه خاموش
  if (visibility === 'OFF') return false;
  const user = getAuthUser();

  // فقط ادمین / مدیر
  if (visibility === 'ADMIN_ONLY') {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }

  // برای همه باز است
  return true;
}
