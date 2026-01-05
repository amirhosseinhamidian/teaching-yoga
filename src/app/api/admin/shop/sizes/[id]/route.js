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

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'شناسه معتبر نیست.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data = {};

    if (body.name != null) data.name = String(body.name || '').trim();
    if (body.slug != null) data.slug = normalizeSlug(body.slug);
    if (body.isActive !== undefined) data.isActive = !!body.isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'هیچ داده‌ای برای بروزرسانی ارسال نشده است.' },
        { status: 400 }
      );
    }

    const updated = await prismadb.size.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_SIZE_PATCH]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'نام یا اسلاگ تکراری است.' },
        { status: 409 }
      );
    }

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'سایز مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'شناسه معتبر نیست.' }, { status: 400 });
    }

    // اگر به محصولی وصل باشد بهتره حذف کامل نکنیم (مثل onDelete: Cascade هست ولی معمولاً نمی‌خوایم)
    const used = await prismadb.productSize.count({ where: { sizeId: id } });
    if (used > 0) {
      return NextResponse.json(
        { error: 'این سایز به محصولاتی متصل است و قابل حذف نیست.' },
        { status: 409 }
      );
    }

    await prismadb.size.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_SIZE_DELETE]', error);

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'سایز مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
