import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get('slug') || '').trim();

    if (!slug) {
      return NextResponse.json({ success: false, data: null }, { status: 200 });
    }

    const cat = await prismadb.productCategory.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, parentId: true },
    });

    return NextResponse.json(
      { success: true, data: cat || null },
      { status: 200 }
    );
  } catch (e) {
    console.error('[CATEGORY_RESOLVE]', e);
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
