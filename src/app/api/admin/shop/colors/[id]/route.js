import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function normalizeHex(x) {
  const s = String(x || '').trim();
  if (!s) return '';
  return s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;
}
function isValidHex(hex) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'شناسه رنگ معتبر نیست.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = {};

    if (body.name != null) {
      const name = String(body.name || '').trim();
      if (!name)
        return NextResponse.json(
          { error: 'نام رنگ الزامی است.' },
          { status: 400 }
        );
      data.name = name;
    }

    if (body.hex != null) {
      const hex = normalizeHex(body.hex);
      if (!isValidHex(hex)) {
        return NextResponse.json(
          { error: 'کد رنگ معتبر نیست. (مثال: #ffcc00)' },
          { status: 400 }
        );
      }
      data.hex = hex;
    }

    if (body.isActive !== undefined) data.isActive = !!body.isActive;

    const updated = await prismadb.color.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error('[ADMIN_SHOP_COLORS_PATCH]', e);
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'نام رنگ تکراری است.' },
        { status: 409 }
      );
    }
    if (e?.code === 'P2025') {
      return NextResponse.json(
        { error: 'رنگ مورد نظر پیدا نشد.' },
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
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'شناسه رنگ معتبر نیست.' },
        { status: 400 }
      );
    }

    // چون رابطه join داریم، اول join ها پاک می‌شن (Cascade)
    await prismadb.color.delete({ where: { id } });

    return NextResponse.json(
      { message: 'رنگ با موفقیت حذف شد.' },
      { status: 200 }
    );
  } catch (e) {
    console.error('[ADMIN_SHOP_COLORS_DELETE]', e);
    if (e?.code === 'P2025') {
      return NextResponse.json(
        { error: 'رنگ مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
