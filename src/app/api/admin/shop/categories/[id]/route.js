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

export async function GET(_req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه دسته‌بندی معتبر نیست.' },
        { status: 400 }
      );
    }

    const item = await prismadb.productCategory.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, title: true, slug: true } },
        children: { select: { id: true, title: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'دسته‌بندی مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_CATEGORY_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه دسته‌بندی معتبر نیست.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = {};

    if (body.title !== undefined) {
      const t = String(body.title || '').trim();
      if (!t)
        return NextResponse.json(
          { error: 'عنوان دسته‌بندی نمی‌تواند خالی باشد.' },
          { status: 400 }
        );
      data.title = t;
    }

    if (body.slug !== undefined) {
      const s = normalizeCategorySlug(body.slug);
      if (!s || s.length < 3)
        return NextResponse.json(
          { error: 'اسلاگ دسته‌بندی باید حداقل ۳ کاراکتر باشد.' },
          { status: 400 }
        );
      data.slug = s;
    }

    if (body.parentId !== undefined) {
      const parentId =
        body.parentId === '' || body.parentId == null
          ? null
          : Number(body.parentId);
      if (parentId != null && (!Number.isFinite(parentId) || parentId <= 0)) {
        return NextResponse.json(
          { error: 'دسته‌بندی والد معتبر نیست.' },
          { status: 400 }
        );
      }
      if (parentId === id) {
        return NextResponse.json(
          { error: 'دسته‌بندی نمی‌تواند والد خودش باشد.' },
          { status: 400 }
        );
      }
      data.parentId = parentId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'هیچ داده‌ای برای بروزرسانی ارسال نشده است.' },
        { status: 400 }
      );
    }

    const updated = await prismadb.productCategory.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, title: true, slug: true } },
        children: { select: { id: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_CATEGORY_PATCH]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این اسلاگ قبلاً ثبت شده است.' },
        { status: 409 }
      );
    }
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'دسته‌بندی مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه دسته‌بندی معتبر نیست.' },
        { status: 400 }
      );
    }

    // جلوگیری از حذف اگر محصول دارد یا زیرمجموعه دارد
    const cat = await prismadb.productCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!cat) {
      return NextResponse.json(
        { error: 'دسته‌بندی مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    if (cat._count.products > 0) {
      return NextResponse.json(
        { error: 'این دسته‌بندی دارای محصول است و قابل حذف نیست.' },
        { status: 409 }
      );
    }

    if (cat._count.children > 0) {
      return NextResponse.json(
        { error: 'این دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست.' },
        { status: 409 }
      );
    }

    await prismadb.productCategory.delete({ where: { id } });

    return NextResponse.json(
      { message: 'دسته‌بندی با موفقیت حذف شد.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_SHOP_CATEGORY_DELETE]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
