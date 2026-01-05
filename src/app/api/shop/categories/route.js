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

    const items = await prismadb.productCategory.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[SHOP_CATEGORIES_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
