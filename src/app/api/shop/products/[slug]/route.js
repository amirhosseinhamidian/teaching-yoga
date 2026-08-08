import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const enabled = await getShopEnabled();

    if (!enabled) {
      return NextResponse.json(
        { error: 'فروشگاه در حال حاضر غیرفعال است.' },
        { status: 403 }
      );
    }

    const raw = String(params?.slug || '');
    const slug = decodeURIComponent(raw).trim();

    if (!slug) {
      return NextResponse.json({ error: 'اسلاگ معتبر نیست.' }, { status: 400 });
    }

    const product = await prismadb.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        images: true,
        details: true,
        stock: true,
        price: true,
        compareAt: true,
        weightGram: true,
        isActive: true,
        category: {
          select: {
            id: true,
            title: true,
            slug: true,
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
        sizes: {
          select: {
            size: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'محصول مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    const normalizedProduct = {
      ...product,
      coverImage: toAbsoluteMediaUrl(product.coverImage),
      images: Array.isArray(product.images)
        ? product.images.map((image) => toAbsoluteMediaUrl(image))
        : [],
      colors: (product.colors || []).map((item) => item.color),
      sizes: (product.sizes || []).map((item) => item.size),
    };

    return NextResponse.json(normalizedProduct, { status: 200 });
  } catch (error) {
    console.error('[SHOP_PRODUCT_GET]', error);

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
