import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';

export async function GET() {
  try {
    const user = getAuthUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prismadb.productCategory.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    });

    // DropDown شما با {id,title} کار می‌کنه
    const categoryOptions = categories.map((c) => ({
      value: c.id,
      label: c.title,
    }));

    return NextResponse.json({ categoryOptions }, { status: 200 });
  } catch (e) {
    console.error('ADMIN PRODUCT CATEGORY FILTER ERROR:', e);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
