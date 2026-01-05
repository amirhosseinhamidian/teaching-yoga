// app/api/shop/products/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getShopEnabled } from '@/utils/server/shopGuard';

export const dynamic = 'force-dynamic';

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseIdsCSV(raw) {
  const s = String(raw || '').trim();
  if (!s) return [];
  return s
    .split(',')
    .map((x) => toInt(x))
    .filter((x) => Number.isFinite(x) && x > 0);
}

/**
 * ✅ گرفتن id کتگوری + تمام زیرشاخه‌ها (فرزند، نوه، ...)
 * بدون N+1: یکبار کل کتگوری‌ها رو می‌گیریم و در حافظه traversal می‌کنیم
 */
async function getCategoryAndDescendantsIds(rootId) {
  const id = toInt(rootId);
  if (!id || id <= 0) return null;

  const all = await prismadb.productCategory.findMany({
    select: { id: true, parentId: true },
  });

  // parentId -> [childId...]
  const childrenMap = new Map();
  for (const c of all) {
    const p = c.parentId ?? null;
    if (!childrenMap.has(p)) childrenMap.set(p, []);
    childrenMap.get(p).push(c.id);
  }

  const result = [];
  const queue = [id];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || seen.has(cur)) continue;
    seen.add(cur);
    result.push(cur);

    const kids = childrenMap.get(cur) || [];
    for (const k of kids) queue.push(k);
  }

  // ✅ فقط عددهای معتبر
  const cleaned = result.filter((x) => Number.isFinite(x) && x > 0);
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

    const categoryIdRaw = searchParams.get('categoryId');
    const categoryId = toInt(categoryIdRaw);

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

    // ✅ categoryId + descendants
    const categoryIdsForFilter = categoryId
      ? await getCategoryAndDescendantsIds(categoryId)
      : null;

    const where = {
      isActive: true,

      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),

      ...(categoryIdsForFilter
        ? { categoryId: { in: categoryIdsForFilter } }
        : {}),

      ...(inStock ? { stock: { gt: 0 } } : {}),

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
                colorId: { in: colorIds },
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
          category: { select: { id: true, title: true } },
          colors: {
            select: {
              color: { select: { id: true, name: true, hex: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prismadb.product.count({ where }),
    ]);

    const normalizedItems = items.map((p) => ({
      ...p,
      colors: (p.colors || []).map((x) => x.color),
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
          categoryIdsUsed: categoryIdsForFilter || null, // اختیاری برای دیباگ
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('[SHOP_PRODUCTS_GET]', e);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
