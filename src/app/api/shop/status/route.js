// /app/api/shop/status/route.ts
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const site = await prismadb.siteInfo.findFirst({
      orderBy: { id: 'asc' },
      select: {
        shopVisibility: true,
      },
    });

    return NextResponse.json(
      {
        shopVisibility: site?.shopVisibility ?? 'ALL',
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
