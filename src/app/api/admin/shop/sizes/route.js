import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isMeaningfulSlug(s) {
  return /[a-z0-9\u0600-\u06FF]/i.test(String(s || ''));
}

// GET /api/admin/shop/sizes
export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get('search') || '').trim();
    const isActiveParam = searchParams.get('isActive'); // "true" | "false"
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get('pageSize') || 50))
    );

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActiveParam === 'true') where.isActive = true;
    if (isActiveParam === 'false') where.isActive = false;

    const [items, total] = await Promise.all([
      prismadb.size.findMany({
        where,
        orderBy: [{ id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prismadb.size.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_SIZES_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

// POST /api/admin/shop/sizes
export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const slug = normalizeSlug(body?.slug || name);

    if (!name) {
      return NextResponse.json(
        { error: 'نام سایز الزامی است.' },
        { status: 400 }
      );
    }

    if (!slug || slug.length < 1 || !isMeaningfulSlug(slug)) {
      return NextResponse.json(
        { error: 'اسلاگ سایز معتبر نیست.' },
        { status: 400 }
      );
    }

    const created = await prismadb.size.create({
      data: {
        name,
        slug,
        isActive: body?.isActive == null ? true : !!body.isActive,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_SHOP_SIZES_POST]', error);

    if (error?.code === 'P2002') {
      // احتمالاً slug یا name یونیک شده
      return NextResponse.json(
        { error: 'این سایز قبلاً ثبت شده است.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
