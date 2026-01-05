import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-') // فاصله/نیم فاصله -> -
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '') // فارسی/انگلیسی/عدد/-
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { isValid: false, message: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const slugRaw = searchParams.get('slug');
    const excludeId = searchParams.get('excludeId');

    const slug = normalizeSlug(slugRaw);

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { isValid: false, message: 'اسلاگ باید حداقل ۳ کاراکتر باشد.' },
        { status: 200 }
      );
    }

    // فارسی + انگلیسی + عدد + -
    if (!/^[a-z0-9\u0600-\u06FF-]+$/i.test(slug)) {
      return NextResponse.json(
        {
          isValid: false,
          message:
            'اسلاگ فقط می‌تواند شامل حروف فارسی/انگلیسی، اعداد و "-" باشد.',
        },
        { status: 200 }
      );
    }

    const where = excludeId
      ? { slug, NOT: { id: Number(excludeId) } }
      : { slug };

    const existing = await prismadb.product.findFirst({
      where,
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { isValid: false, message: 'این اسلاگ قبلاً استفاده شده است.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { isValid: true, message: 'اسلاگ قابل استفاده است.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_VALIDATE_PRODUCT_SLUG_GET]', error);
    return NextResponse.json(
      { isValid: false, message: 'خطای داخلی سرور' },
      { status: 500 }
    );
  }
}
