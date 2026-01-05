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

export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const items = await prismadb.color.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    console.error('[ADMIN_SHOP_COLORS_GET]', e);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name = String(body.name || '').trim();
    const hex = normalizeHex(body.hex);

    if (!name) {
      return NextResponse.json(
        { error: 'نام رنگ الزامی است.' },
        { status: 400 }
      );
    }
    if (!isValidHex(hex)) {
      return NextResponse.json(
        { error: 'کد رنگ معتبر نیست. (مثال: #ffcc00)' },
        { status: 400 }
      );
    }

    const created = await prismadb.color.create({
      data: {
        name,
        hex,
        isActive: body.isActive == null ? true : !!body.isActive,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('[ADMIN_SHOP_COLORS_POST]', e);
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'نام رنگ تکراری است.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
