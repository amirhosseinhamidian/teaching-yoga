import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

// GET /api/shop/sizes
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = String(searchParams.get('search') || '').trim();

    const where = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prismadb.size.findMany({
      where,
      orderBy: [{ id: 'desc' }],
      select: { id: true, name: true, slug: true },
    });

    // خروجی ساده (مثل colors)
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('[SHOP_SIZES_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
