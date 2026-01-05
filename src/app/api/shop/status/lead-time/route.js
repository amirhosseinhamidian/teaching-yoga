/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function canUserAccessShop(shopVisibility, user) {
  const v = String(shopVisibility || 'ALL').toUpperCase();

  if (v === 'OFF') return false;
  if (v === 'ADMIN_ONLY') {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }
  return true; // ALL
}

export async function GET() {
  try {
    const user = getAuthUser();

    const site = await prismadb.siteInfo.findFirst({
      orderBy: { id: 'asc' },
      select: {
        shopVisibility: true,
        shopLeadTimeDays: true,
      },
    });

    const shopVisibility = site?.shopVisibility ?? 'ALL';
    const shopLeadTimeDays = site?.shopLeadTimeDays ?? 1;

    const canAccess = canUserAccessShop(shopVisibility, user);

    return NextResponse.json(
      {
        canAccess, // ✅ برای navbar / guard
        shopVisibility, // OFF | ADMIN_ONLY | ALL
        shopLeadTimeDays, // ✅ برای صفحه پرداخت
        isAdmin: user?.role === 'ADMIN' || user?.role === 'MANAGER',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SHOP_STATUS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
