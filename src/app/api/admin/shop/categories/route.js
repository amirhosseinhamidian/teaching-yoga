import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function normalizeCategorySlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get('search') || '').trim();

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prismadb.productCategory.findMany({
      where,
      include: {
        parent: { select: { id: true, title: true, slug: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_CATEGORIES_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = String(body.title || '').trim();
    const slug = normalizeCategorySlug(body.slug || title);
    const parentId =
      body.parentId === '' || body.parentId == null
        ? null
        : Number(body.parentId);

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان دسته‌بندی الزامی است.' },
        { status: 400 }
      );
    }
    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: 'اسلاگ دسته‌بندی باید حداقل ۳ کاراکتر باشد.' },
        { status: 400 }
      );
    }
    if (parentId != null && (!Number.isFinite(parentId) || parentId <= 0)) {
      return NextResponse.json(
        { error: 'دسته‌بندی والد معتبر نیست.' },
        { status: 400 }
      );
    }

    const created = await prismadb.productCategory.create({
      data: {
        title,
        slug,
        parentId,
      },
      include: {
        parent: { select: { id: true, title: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_SHOP_CATEGORIES_POST]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این اسلاگ قبلاً ثبت شده است.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
