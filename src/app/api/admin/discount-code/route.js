import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    // گرفتن پارامترها از Query String
    const page = parseInt(searchParams.get('page')) || 1; // شماره صفحه
    const perPage = parseInt(searchParams.get('perPage')) || 10; // تعداد رکوردها در هر صفحه
    const search = searchParams.get('search') || ''; // جستجو بر اساس عنوان
    const isActive = searchParams.get('isActive'); // فیلتر بر اساس فعال بودن (true/false/null)

    // محاسبه مقادیر برای صفحه‌بندی
    const skip = (page - 1) * perPage; // تعداد رکوردهایی که باید نادیده گرفته شوند
    const take = perPage; // تعداد رکوردهایی که باید بازگردانده شوند

    // ساخت شرط جستجو
    const whereClause = {
      AND: [
        search
          ? {
              title: {
                contains: search,
                mode: 'insensitive', // جستجوی غیرحساس به حروف بزرگ و کوچک
              },
            }
          : {}, // اگر پارامتر جستجو خالی باشد، شرطی اعمال نشود
        isActive !== null
          ? { isActive: isActive === 'true' } // اگر isActive مشخص باشد
          : {}, // اگر isActive خالی باشد، شرطی اعمال نشود
      ],
    };

    // دریافت داده‌ها از دیتابیس
    const discountCodes = await prismadb.discountCode.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc', // مرتب‌سازی بر اساس تاریخ ایجاد (جدیدترین به قدیمی‌ترین)
      },
      skip,
      take,
    });

    // محاسبه تعداد کل رکوردها برای صفحه‌بندی
    const totalRecords = await prismadb.discountCode.count({
      where: whereClause,
    });

    // محاسبه تعداد صفحات
    const totalPages = Math.ceil(totalRecords / perPage);

    // پاسخ نهایی
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
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // داده‌های اجباری و اعتبارسنجی ساده
    const {
      title,
      code,
      discountPercent,
      maxDiscountAmount,
      usageLimit,
      minPurchaseAmount,
      expiryDate,
      description,
      courseId,
      isActive,
    } = body;

    if (!title || !code || !discountPercent) {
      return NextResponse.json(
        { success: false, message: 'عنوان، کد و درصد تخفیف اجباری هستند.' },
        { status: 400 },
      );
    }

    const newDiscountCode = await prismadb.discountCode.create({
      data: {
        title,
        code,
        discountPercent: parseFloat(discountPercent),
        maxDiscountAmount: maxDiscountAmount
          ? parseFloat(maxDiscountAmount)
          : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        minPurchaseAmount: minPurchaseAmount
          ? parseFloat(minPurchaseAmount)
          : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description,
        courseId: courseId ? parseInt(courseId) : null,
        isActive: isActive ?? true,
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
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id'); // دریافت id از Query Params

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'شناسه کد تخفیف الزامی است.' },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      code,
      discountPercent,
      maxDiscountAmount,
      usageLimit,
      minPurchaseAmount,
      expiryDate,
      description,
      courseId,
      isActive,
    } = body;

    const updatedDiscountCode = await prismadb.discountCode.update({
      where: { id: parseInt(id) },
      data: {
        title,
        code,
        discountPercent: parseFloat(discountPercent),
        maxDiscountAmount: maxDiscountAmount
          ? parseFloat(maxDiscountAmount)
          : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        minPurchaseAmount: minPurchaseAmount
          ? parseFloat(minPurchaseAmount)
          : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description,
        courseId: courseId ? parseInt(courseId) : null,
        isActive: isActive ?? true,
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
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id'); // دریافت id از Query Params

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'شناسه کد تخفیف الزامی است.' },
      { status: 400 },
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
      { status: 500 },
    );
  }
}
