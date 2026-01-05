import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const enabled = await getShopEnabled();
    if (!enabled) {
      return NextResponse.json(
        { error: 'فروشگاه در حال حاضر غیرفعال است.' },
        { status: 403 }
      );
    }

    const items = await prismadb.color.findMany({
      select: { id: true, name: true, hex: true },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[SHOP_COLORS_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
