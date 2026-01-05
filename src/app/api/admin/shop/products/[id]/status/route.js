import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'شناسه محصول معتبر نیست.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'مقدار isActive باید true یا false باشد.' },
        { status: 400 }
      );
    }

    const updated = await prismadb.product.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json(
      {
        ok: true,
        message: isActive ? 'محصول فعال شد.' : 'محصول غیرفعال شد.',
        product: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCT_STATUS_PATCH]', error);

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'محصول مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
