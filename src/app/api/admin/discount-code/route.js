// /app/api/admin/discount-code/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

const allowedAppliesTo = new Set([
  'ALL',
  'COURSE',
  'PRODUCT',
  'PRODUCT_CATEGORY',
]);

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toFloatOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toBool = (v, def = true) => {
  if (v === null || v === undefined) return def;
  return Boolean(v);
};

const asDateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeAppliesTo = (v) => {
  const s = String(v || '')
    .trim()
    .toUpperCase();
  return allowedAppliesTo.has(s) ? s : null;
};

const validatePayload = async ({
  title,
  code,
  discountPercent,
  appliesTo,
  courseId,
  productCategoryId,
}) => {
  if (
    !title ||
    !code ||
    discountPercent === null ||
    discountPercent === undefined
  ) {
    return 'عنوان، کد و درصد تخفیف اجباری هستند.';
  }

  const dp = Number(discountPercent);
  if (!Number.isFinite(dp) || dp < 0 || dp > 100) {
    return 'درصد تخفیف باید عددی بین ۰ تا ۱۰۰ باشد.';
  }

  if (!appliesTo) return 'نوع تخفیف (appliesTo) نامعتبر است.';

  // قوانین target بر اساس appliesTo
  if (appliesTo === 'PRODUCT_CATEGORY') {
    if (!productCategoryId)
      return 'برای PRODUCT_CATEGORY باید productCategoryId ارسال شود.';
    // validate category exists
    const cat = await prismadb.productCategory.findUnique({
      where: { id: Number(productCategoryId) },
      select: { id: true },
    });
    if (!cat) return 'دسته‌بندی محصول نامعتبر است.';
  }

  if (appliesTo === 'COURSE') {
    // courseId اختیاری: اگر ارسال شد، باید معتبر باشد
    if (courseId) {
      const course = await prismadb.course.findUnique({
        where: { id: Number(courseId) },
        select: { id: true },
      });
      if (!course) return 'دوره نامعتبر است.';
    }
  }

  // در سایر حالت‌ها نباید target داشته باشیم (می‌تونیم نال کنیم)
  return null;
};

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page')) || 1;
    const perPage = parseInt(searchParams.get('perPage')) || 10;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * perPage;
    const take = perPage;

    const whereClause = {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        isActive !== null && isActive !== undefined
          ? { isActive: isActive === 'true' }
          : {},
      ],
    };

    const discountCodes = await prismadb.discountCode.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        // برای نمایش در جدول پنل
        course: { select: { id: true, title: true } },
        productCategory: { select: { id: true, title: true } },
      },
    });

    const totalRecords = await prismadb.discountCode.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalRecords / perPage);

    return NextResponse.json({
      success: true,
      data: discountCodes,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        perPage,
      },
    });
  } catch (error) {
    console.error('خطا در دریافت کدهای تخفیف:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کدهای تخفیف.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const title = body?.title?.trim();
    const code = body?.code?.trim();

    const discountPercent = toFloatOrNull(body?.discountPercent);

    const maxDiscountAmount = toFloatOrNull(body?.maxDiscountAmount);
    const usageLimit = toIntOrNull(body?.usageLimit);
    const minPurchaseAmount = toFloatOrNull(body?.minPurchaseAmount);
    const expiryDate = asDateOrNull(body?.expiryDate);
    const description = body?.description ?? null;

    const appliesTo = normalizeAppliesTo(body?.appliesTo) || 'COURSE'; // default
    const courseId = toIntOrNull(body?.courseId);
    const productCategoryId = toIntOrNull(body?.productCategoryId);

    const isActive = toBool(body?.isActive, true);

    const err = await validatePayload({
      title,
      code,
      discountPercent,
      appliesTo,
      courseId,
      productCategoryId,
    });
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400 }
      );
    }

    // نرمال‌سازی target ها بر اساس appliesTo
    const finalCourseId = appliesTo === 'COURSE' ? courseId : null;
    const finalProductCategoryId =
      appliesTo === 'PRODUCT_CATEGORY' ? productCategoryId : null;

    const newDiscountCode = await prismadb.discountCode.create({
      data: {
        title,
        code,
        discountPercent,
        maxDiscountAmount,
        usageLimit,
        minPurchaseAmount,
        expiryDate,
        description,
        isActive,

        appliesTo,
        courseId: finalCourseId,
        productCategoryId: finalProductCategoryId,
      },
      include: {
        course: { select: { id: true, title: true } },
        productCategory: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت ایجاد شد.',
      data: newDiscountCode,
    });
  } catch (error) {
    console.error('خطا در ایجاد کد تخفیف:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کد تخفیف.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'شناسه کد تخفیف الزامی است.' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const title = body?.title?.trim();
    const code = body?.code?.trim();

    const discountPercent = toFloatOrNull(body?.discountPercent);

    const maxDiscountAmount = toFloatOrNull(body?.maxDiscountAmount);
    const usageLimit = toIntOrNull(body?.usageLimit);
    const minPurchaseAmount = toFloatOrNull(body?.minPurchaseAmount);
    const expiryDate = asDateOrNull(body?.expiryDate);
    const description = body?.description ?? null;

    const appliesTo = normalizeAppliesTo(body?.appliesTo) || 'COURSE';
    const courseId = toIntOrNull(body?.courseId);
    const productCategoryId = toIntOrNull(body?.productCategoryId);

    const isActive = toBool(body?.isActive, true);

    const err = await validatePayload({
      title,
      code,
      discountPercent,
      appliesTo,
      courseId,
      productCategoryId,
    });
    if (err) {
      return NextResponse.json(
        { success: false, message: err },
        { status: 400 }
      );
    }

    const finalCourseId = appliesTo === 'COURSE' ? courseId : null;
    const finalProductCategoryId =
      appliesTo === 'PRODUCT_CATEGORY' ? productCategoryId : null;

    const updatedDiscountCode = await prismadb.discountCode.update({
      where: { id: parseInt(id) },
      data: {
        title,
        code,
        discountPercent,
        maxDiscountAmount,
        usageLimit,
        minPurchaseAmount,
        expiryDate,
        description,
        isActive,

        appliesTo,
        courseId: finalCourseId,
        productCategoryId: finalProductCategoryId,
      },
      include: {
        course: { select: { id: true, title: true } },
        productCategory: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت به‌روزرسانی شد.',
      data: updatedDiscountCode,
    });
  } catch (error) {
    console.error('خطا در به‌روزرسانی کد تخفیف:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی کد تخفیف.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'شناسه کد تخفیف الزامی است.' },
      { status: 400 }
    );
  }

  try {
    await prismadb.discountCode.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('خطا در حذف کد تخفیف:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کد تخفیف.' },
      { status: 500 }
    );
  }
}
