import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

function toInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

function parseIdsCSV(raw) {
  const value = String(raw || '').trim();

  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => toInt(item))
    .filter((item) => Number.isFinite(item) && item > 0);
}

async function getCategoryAndDescendantsIds(rootId) {
  const id = toInt(rootId);

  if (!id || id <= 0) {
    return null;
  }

  const all = await prismadb.productCategory.findMany({
    select: {
      id: true,
      parentId: true,
    },
  });

  const childrenMap = new Map();

  for (const category of all) {
    const parentId = category.parentId ?? null;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }

    childrenMap.get(parentId).push(category.id);
  }

  const result = [];
  const queue = [id];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();

    if (!current || seen.has(current)) {
      continue;
    }

    seen.add(current);
    result.push(current);

    const children = childrenMap.get(current) || [];

    for (const child of children) {
      queue.push(child);
    }
  }

  const cleaned = result.filter((item) => Number.isFinite(item) && item > 0);

  return cleaned.length ? cleaned : null;
}

export async function GET(req) {
  try {
    const enabled = await getShopEnabled();

    if (!enabled) {
      return NextResponse.json(
        { error: 'فروشگاه در حال حاضر غیرفعال است.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(1, toInt(searchParams.get('page')) || 1);

    const pageSize = Math.min(
      100,
      Math.max(1, toInt(searchParams.get('pageSize')) || 20)
    );

    const sort = String(searchParams.get('sort') || 'newest');
    const search = String(searchParams.get('search') || '').trim();
    const categoryId = toInt(searchParams.get('categoryId'));
    const colorIds = parseIdsCSV(searchParams.get('colorIds'));

    const minPriceRaw = String(searchParams.get('minPrice') || '').trim();

    const maxPriceRaw = String(searchParams.get('maxPrice') || '').trim();

    const minPrice = minPriceRaw
      ? Number(minPriceRaw.replaceAll(',', ''))
      : null;

    const maxPrice = maxPriceRaw
      ? Number(maxPriceRaw.replaceAll(',', ''))
      : null;

    const inStock = String(searchParams.get('inStock') || '') === 'true';

    const categoryIdsForFilter = categoryId
      ? await getCategoryAndDescendantsIds(categoryId)
      : null;

    const where = {
      isActive: true,

      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),

      ...(categoryIdsForFilter
        ? {
            categoryId: {
              in: categoryIdsForFilter,
            },
          }
        : {}),

      ...(inStock
        ? {
            stock: {
              gt: 0,
            },
          }
        : {}),

      ...(minPrice != null || maxPrice != null
        ? {
            price: {
              ...(Number.isFinite(minPrice) ? { gte: minPrice } : {}),
              ...(Number.isFinite(maxPrice) ? { lte: maxPrice } : {}),
            },
          }
        : {}),

      ...(colorIds.length
        ? {
            colors: {
              some: {
                colorId: {
                  in: colorIds,
                },
              },
            },
          }
        : {}),
    };

    const orderBy =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : { id: 'desc' };

    const [items, total] = await Promise.all([
      prismadb.product.findMany({
        where,
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
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      prismadb.product.count({
        where,
      }),
    ]);

    const normalizedItems = items.map((product) => ({
      ...product,
      coverImage: toAbsoluteMediaUrl(product.coverImage),
      images: Array.isArray(product.images)
        ? product.images.map((image) => toAbsoluteMediaUrl(image))
        : [],
      colors: (product.colors || []).map((item) => item.color),
    }));

    const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 20)));

    return NextResponse.json(
      {
        items: normalizedItems,
        total,
        page,
        totalPages,
        pageSize,
        meta: {
          categoryIdsUsed: categoryIdsForFilter || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SHOP_PRODUCTS_GET]', error);

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
