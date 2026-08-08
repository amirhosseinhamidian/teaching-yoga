import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

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

    const limit = 10;

    const products = await prismadb.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        images: true,
        price: true,
        compareAt: true,
        stock: true,
        isActive: true,
        category: {
          select: {
            id: true,
            title: true,
          },
        },
        colors: {
          select: {
            color: {
              select: {
                id: true,
                name: true,
                hex: true,
              },
            },
          },
        },
      },
    });

    const normalizedItems = products.map((product) => ({
      ...product,
      coverImage: toAbsoluteMediaUrl(product.coverImage),
      images: Array.isArray(product.images)
        ? product.images.map((image) => toAbsoluteMediaUrl(image))
        : [],
      colors: (product.colors || []).map(({ color }) => ({
        id: color.id,
        name: color.name,
        hex: color.hex,
      })),
    }));

    return NextResponse.json(
      {
        success: true,
        data: normalizedItems,
        meta: {
          limit,
          total: products.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SHOP_LAST_TEN_PRODUCTS]', error);

    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت محصولات جدید فروشگاه.',
      },
      { status: 500 }
    );
  }
}
