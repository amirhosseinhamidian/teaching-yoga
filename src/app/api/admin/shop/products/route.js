import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { normalizeUrlSlug } from '@/utils/slug';

export const dynamic = 'force-dynamic';

function isValidHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز است.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = String(searchParams.get('search') || '').trim();
    const categoryIdParam = searchParams.get('categoryId');
    const isActiveParam = searchParams.get('isActive'); // "true" | "false"

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get('pageSize') || 20))
    );

    /** @type {import('@prisma/client').Prisma.ProductWhereInput} */
    const where = {};

    // search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { urlSlug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // categoryId
    if (categoryIdParam != null && categoryIdParam !== '') {
      const cid = Number(categoryIdParam);
      if (!Number.isFinite(cid) || cid <= 0) {
        return NextResponse.json(
          { error: 'شناسه دسته‌بندی معتبر نیست.' },
          { status: 400 }
        );
      }
      where.categoryId = cid;
    }

    // isActive
    if (isActiveParam === 'true') where.isActive = true;
    if (isActiveParam === 'false') where.isActive = false;

    const [rawItems, total] = await Promise.all([
      prismadb.product.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          urlSlug: true,

          coverImage: true,
          images: true,

          stock: true,
          price: true,
          compareAt: true,
          weightGram: true,

          isActive: true,

          // ✅ NEW
          packageBoxTypeId: true,

          category: {
            select: { id: true, title: true },
          },

          // join tables
          colors: {
            select: {
              color: { select: { id: true, name: true, hex: true } },
            },
          },
          sizes: {
            select: {
              size: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prismadb.product.count({ where }),
    ]);

    // ✅ normalize relations (like your PATCH response)
    const items = (rawItems || []).map((p) => ({
      ...p,
      colors: (p.colors || []).map((x) => x.color).filter(Boolean),
      sizes: (p.sizes || []).map((x) => x.size).filter(Boolean),
    }));

    return NextResponse.json({ items, total, page, pageSize }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCTS_GET]', error);
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

    const title = body.title;
    const slug = body.slug
      ? normalizeUrlSlug(body.slug)
      : normalizeUrlSlug(title);

    const description =
      typeof body.description === 'string' ? body.description : null;

    const price = Number(body.price);
    const compareAt =
      body.compareAt === '' || body.compareAt == null
        ? null
        : Number(body.compareAt);

    const stock =
      body.stock === '' || body.stock == null ? 0 : Number(body.stock);

    const categoryId =
      body.categoryId === '' || body.categoryId == null
        ? null
        : Number(body.categoryId);

    const weightGram =
      body.weightGram === '' || body.weightGram == null
        ? null
        : Number(body.weightGram);

    const isActive = body.isActive == null ? true : !!body.isActive;

    // ✅ NEW
    const packageBoxTypeId =
      body.packageBoxTypeId === '' || body.packageBoxTypeId == null
        ? null
        : Number(body.packageBoxTypeId);

    if (
      packageBoxTypeId != null &&
      (!Number.isFinite(packageBoxTypeId) || packageBoxTypeId <= 0)
    ) {
      return NextResponse.json(
        { error: 'نوع بسته‌بندی (Box) معتبر نیست.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'عنوان محصول الزامی است.' },
        { status: 400 }
      );
    }

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: 'اسلاگ باید حداقل ۳ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'قیمت باید عددی معتبر و بزرگتر از صفر باشد.' },
        { status: 400 }
      );
    }

    if (compareAt != null && (!Number.isFinite(compareAt) || compareAt < 0)) {
      return NextResponse.json(
        { error: 'قیمت قبل تخفیف معتبر نیست.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json(
        { error: 'موجودی معتبر نیست.' },
        { status: 400 }
      );
    }

    if (categoryId != null && !Number.isFinite(categoryId)) {
      return NextResponse.json(
        { error: 'دسته‌بندی انتخاب شده معتبر نیست.' },
        { status: 400 }
      );
    }

    if (
      weightGram != null &&
      (!Number.isFinite(weightGram) || weightGram < 0)
    ) {
      return NextResponse.json({ error: 'وزن معتبر نیست.' }, { status: 400 });
    }

    const urlSlug = normalizeUrlSlug(body.urlSlug || body.title);
    const safeUrlSlug =
      urlSlug && urlSlug.length >= 3 ? urlSlug : `product-${Date.now()}`;

    const coverImageRaw = String(body.coverImage || '').trim();
    const coverImage = coverImageRaw
      ? isValidHttpUrl(coverImageRaw)
        ? coverImageRaw
        : null
      : null;

    const images = Array.isArray(body.images)
      ? body.images
          .map((x) => String(x || '').trim())
          .filter((x) => x && isValidHttpUrl(x))
      : [];

    const details = Array.isArray(body.details)
      ? body.details
          .map((x) => ({
            key: String(x?.key || '').trim(),
            value: String(x?.value || '').trim(),
          }))
          .filter((x) => x.key && x.value)
      : [];

    const colorIds = Array.isArray(body.colorIds)
      ? body.colorIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
      : [];

    const sizeIds = Array.isArray(body.sizeIds)
      ? body.sizeIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
      : [];

    const created = await prismadb.product.create({
      data: {
        title: String(title).trim(),
        slug,
        urlSlug: safeUrlSlug,
        description,
        images,
        coverImage,
        details: details.length ? details : null,
        isActive,
        price,
        compareAt,
        stock,
        weightGram,
        categoryId,

        // ✅ NEW
        packageBoxTypeId,

        colors: colorIds.length
          ? {
              createMany: {
                data: colorIds.map((colorId) => ({ colorId })),
                skipDuplicates: true,
              },
            }
          : undefined,

        sizes: sizeIds.length
          ? {
              createMany: {
                data: sizeIds.map((sizeId) => ({ sizeId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCTS_POST]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'این اسلاگ قبلاً ثبت شده است.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
