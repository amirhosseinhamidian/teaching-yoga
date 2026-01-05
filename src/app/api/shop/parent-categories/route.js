import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const enabled = await getShopEnabled();
    if (!enabled) {
      return NextResponse.json(
        { error: 'فروشگاه در حال حاضر غیرفعال است.' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);

    // اگر فقط کتگوری‌های اصلی رو خواستی:
    const onlyParents = (searchParams.get('onlyParents') || '1').trim(); // پیش‌فرض 1

    const where =
      onlyParents === '1' || onlyParents === 'true' ? { parentId: null } : {};

    const categories = await prismadb.productCategory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[PRODUCT_CATEGORIES_GET]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کتگوری‌ها.' },
      { status: 500 }
    );
  }
}
