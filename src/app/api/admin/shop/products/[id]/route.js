import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { normalizeUrlSlug } from '@/utils/slug';

export const dynamic = 'force-dynamic';

function isValidHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

export async function GET(_req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه محصول معتبر نیست.' },
        { status: 400 }
      );
    }

    const product = await prismadb.product.findUnique({
      where: { id },
      include: {
        category: true,
        colors: {
          include: {
            color: true,
          },
        },
        sizes: { include: { size: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'محصول مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    const normalized = {
      ...product,
      colors: product.colors.map((x) => x.color),
      sizes: (product.sizes || []).map((x) => x.size),
    };

    return NextResponse.json({ product: normalized }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCT_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

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

    const body = await req.json();
    const data = {};

    // فیلدهای متنی
    if (body.title != null) data.title = String(body.title).trim();
    if (body.slug != null) data.slug = normalizeUrlSlug(body.slug);

    if (body.description !== undefined) {
      data.description =
        typeof body.description === 'string' ? body.description : null;
    }

    // ✅ NEW: packageBoxTypeId
    if (body.packageBoxTypeId !== undefined) {
      const v =
        body.packageBoxTypeId === '' || body.packageBoxTypeId == null
          ? null
          : Number(body.packageBoxTypeId);

      if (v != null && (!Number.isFinite(v) || v <= 0)) {
        return NextResponse.json(
          { error: 'نوع بسته‌بندی (Box) معتبر نیست.' },
          { status: 400 }
        );
      }

      data.packageBoxTypeId = v;
    }

    if (body.coverImage !== undefined) {
      const c = String(body.coverImage || '').trim();
      if (!c) {
        data.coverImage = null;
      } else if (!isValidHttpUrl(c)) {
        return NextResponse.json(
          { error: 'لینک کاور باید با http یا https شروع شود.' },
          { status: 400 }
        );
      } else {
        data.coverImage = c;
      }
    }

    // JSON ها
    if (body.images !== undefined) {
      if (!Array.isArray(body.images)) {
        return NextResponse.json(
          { error: 'فرمت تصاویر معتبر نیست.' },
          { status: 400 }
        );
      }

      const images = body.images
        .map((x) => String(x || '').trim())
        .filter((x) => x && isValidHttpUrl(x));

      data.images = images;
    }

    if (body.details !== undefined) {
      if (body.details == null) {
        data.details = null;
      } else if (!Array.isArray(body.details)) {
        return NextResponse.json(
          { error: 'فرمت جزئیات محصول معتبر نیست.' },
          { status: 400 }
        );
      } else {
        const normalizedDetails = body.details
          .map((x) => ({
            key: String(x?.key || '').trim(),
            value: String(x?.value || '').trim(),
          }))
          .filter((x) => x.key && x.value);

        data.details = normalizedDetails.length ? normalizedDetails : null;
      }
    }

    // قیمت‌ها
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: 'قیمت وارد شده معتبر نیست.' },
          { status: 400 }
        );
      }
      data.price = price;
    }

    if (body.compareAt !== undefined) {
      const compareAt =
        body.compareAt === '' || body.compareAt == null
          ? null
          : Number(body.compareAt);
      if (compareAt != null && (!Number.isFinite(compareAt) || compareAt < 0)) {
        return NextResponse.json(
          { error: 'قیمت قبل از تخفیف معتبر نیست.' },
          { status: 400 }
        );
      }
      data.compareAt = compareAt;
    }

    // موجودی
    if (body.stock !== undefined) {
      const stock =
        body.stock === '' || body.stock == null ? 0 : Number(body.stock);
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json(
          { error: 'موجودی وارد شده معتبر نیست.' },
          { status: 400 }
        );
      }
      data.stock = stock;
    }

    // وزن
    if (body.weightGram !== undefined) {
      const weightGram =
        body.weightGram === '' || body.weightGram == null
          ? null
          : Number(body.weightGram);

      if (
        weightGram != null &&
        (!Number.isFinite(weightGram) || weightGram < 0)
      ) {
        return NextResponse.json(
          { error: 'وزن وارد شده معتبر نیست.' },
          { status: 400 }
        );
      }

      data.weightGram = weightGram;
    }

    // دسته‌بندی
    if (body.categoryId !== undefined) {
      const categoryId =
        body.categoryId === '' || body.categoryId == null
          ? null
          : Number(body.categoryId);
      if (categoryId != null && !Number.isFinite(categoryId)) {
        return NextResponse.json(
          { error: 'دسته‌بندی انتخاب‌شده معتبر نیست.' },
          { status: 400 }
        );
      }
      data.categoryId = categoryId;
    }

    const colorIds = Array.isArray(body.colorIds)
      ? body.colorIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
      : null;

    const sizeIds = Array.isArray(body.sizeIds)
      ? body.sizeIds.map(Number).filter((x) => Number.isFinite(x) && x > 0)
      : null;

    if (body.isActive !== undefined) {
      data.isActive = !!body.isActive;
    }

    const urlSlug = normalizeUrlSlug(body.urlSlug || body.title);
    const safeUrlSlug =
      urlSlug && urlSlug.length >= 3 ? urlSlug : `product-${Date.now()}`;
    data.urlSlug = safeUrlSlug;

    const hasRelUpdate = colorIds !== null || sizeIds !== null;

    if (Object.keys(data).length === 0 && !hasRelUpdate) {
      return NextResponse.json(
        { error: 'هیچ داده‌ای برای بروزرسانی ارسال نشده است.' },
        { status: 400 }
      );
    }

    const updated = await prismadb.product.update({
      where: { id },
      data: {
        ...data,
        ...(colorIds
          ? {
              colors: {
                deleteMany: {},
                createMany: {
                  data: colorIds.map((colorId) => ({ colorId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
        ...(sizeIds !== null
          ? {
              sizes: {
                deleteMany: {},
                createMany: {
                  data: sizeIds.map((sizeId) => ({ sizeId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      include: {
        category: true,
        colors: { include: { color: true } },
        sizes: { include: { size: true } },
      },
    });

    const normalized = {
      ...updated,
      colors: (updated.colors || []).map((x) => x.color),
      sizes: (updated.sizes || []).map((x) => x.size),
    };

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCT_PATCH]', error);

    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'اسلاگ تکراری است.' }, { status: 409 });
    }

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'محصول مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

// حذف کامل محصول
export async function DELETE(_req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      // بهتره حذف کامل فقط ADMIN باشه
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

    // اگر در آیتم‌های سفارش استفاده شده باشد، به خاطر onDelete: Restrict حذف fail می‌شود
    // پس قبلش چک می‌کنیم:
    const usedInOrders = await prismadb.shopOrderItem.count({
      where: { productId: id },
    });

    if (usedInOrders > 0) {
      return NextResponse.json(
        {
          error:
            'این محصول قبلاً در سفارش‌ها ثبت شده و امکان حذف کامل آن وجود ندارد.',
        },
        { status: 409 }
      );
    }

    // اگر در سبدها باشد، چون onDelete: Cascade است، با حذف محصول آیتم‌های سبد هم حذف می‌شوند.
    await prismadb.product.delete({ where: { id } });

    return NextResponse.json(
      { ok: true, message: 'محصول با موفقیت حذف شد.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_SHOP_PRODUCT_DELETE]', error);

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'محصول مورد نظر پیدا نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
