import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, subtitle, duration, price, discount } = body;

    // بررسی ورود داده‌ها
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string.' },
        { status: 400 },
      );
    }

    // ایجاد ترم جدید در دیتابیس
    const newTerm = await prismadb.term.create({
      data: {
        name,
        subtitle: subtitle || null,
        duration: duration || 0,
        price: price || 0,
        discount: discount || 0,
      },
    });

    return NextResponse.json(
      { message: 'Term created successfully.', term: newTerm },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating term:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the term.' },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    // دریافت پارامترهای کوئری از URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10); // شماره صفحه
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد در هر صفحه
    const courseId = searchParams.get('courseId'); // دریافت شناسه دوره

    // محاسبه offset و limit
    const skip = (page - 1) * perPage;
    const take = perPage;

    // ساخت شرط برای فیلتر دوره‌ها
    const filterByCourse =
      courseId && courseId !== '-1'
        ? {
            courseTerms: {
              some: {
                courseId: parseInt(courseId, 10),
              },
            },
          }
        : {};

    // دریافت ترم‌ها و اطلاعات دوره‌های متصل
    const terms = await prismadb.term.findMany({
      skip,
      take,
      where: filterByCourse, // فیلتر بر اساس دوره (اگر شناسه داده شده باشد)
      orderBy: {
        createAt: 'desc', // مرتب‌سازی از آخر به اول بر اساس createdAt
      },
      include: {
        courseTerms: {
          include: {
            course: true, // دریافت اطلاعات دوره متصل
          },
        },
      },
    });

    // شمارش کل ترم‌ها برای صفحه‌بندی
    const totalTerms = await prismadb.term.count({
      where: filterByCourse, // شمارش فقط ترم‌های مرتبط
    });

    // ساخت پاسخ
    const response = {
      terms: terms.map((term) => ({
        ...term,
        courses: term.courseTerms.map((courseTerm) => ({
          id: courseTerm.course.id,
          title: courseTerm.course.title, // فرض می‌کنیم مدل Course شامل فیلد title است
        })),
      })),
      pagination: {
        currentPage: page,
        perPage,
        totalPages: Math.ceil(totalTerms / perPage),
        totalItems: totalTerms,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { error: 'مشکلی در پردازش درخواست وجود دارد.' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const { termId, name, subtitle, price, discount } = await request.json(); // اطلاعات ترم جدید از body درخواست

  try {
    // 1. آپدیت ترم در جدول Term
    const updatedTerm = await prismadb.term.update({
      where: { id: termId },
      data: {
        name,
        subtitle,
        price,
        discount,
        updatedAt: new Date(),
      },
    });

    // 2. بررسی سبد خریدهایی که در وضعیت "PENDING" هستند
    const pendingCarts = await prismadb.cart.findMany({
      where: {
        status: 'PENDING',
        cartTerms: {
          some: {
            termId: termId, // بررسی ترم‌های موجود در سبد خرید
          },
        },
      },
      include: {
        cartTerms: true, // شامل کردن ترم‌ها در سبد خرید
      },
    });

    // 3. آپدیت قیمت و تخفیف ترم‌ها در سبد خریدها
    for (const cart of pendingCarts) {
      for (const cartTerm of cart.cartTerms) {
        if (cartTerm.termId === termId) {
          // محاسبه مبلغ تخفیف
          const discountAmount = price * (discount / 100); // تخفیف به صورت مبلغ
          const finalPrice = price - discountAmount; // قیمت نهایی ترم در سبد خرید

          // 4. آپدیت ترم در سبد خرید
          await prismadb.cartTerm.update({
            where: { id: cartTerm.id },
            data: {
              price: finalPrice,
              discount: discountAmount,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Term and cart updated successfully',
      term: updatedTerm,
    });
  } catch (error) {
    console.error('Error updating term and cart:', error);
    return NextResponse.json(
      { error: 'Failed to update term and cart' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const termId = parseInt(request.headers.get('Term-ID'), 10);

    if (!termId) {
      return NextResponse.json(
        { error: 'شناسه ترم معتبر نیست.' },
        { status: 400 },
      );
    }

    // شروع تراکنش برای اطمینان از انجام موفقیت‌آمیز عملیات
    await prismadb.$transaction(async (prisma) => {
      // دریافت اطلاعات ترم برای محاسبات تخفیف
      const term = await prisma.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        throw new Error('ترم پیدا نشد.');
      }

      // حذف وابستگی‌ها از جدول `CartTerm` و به‌روزرسانی `Cart`
      const cartTerms = await prisma.cartTerm.findMany({
        where: {
          termId, // پیدا کردن CartTerm‌های مرتبط با ترم
          cart: {
            status: 'PENDING', // فقط سبد خرید‌هایی که وضعیت PENDING دارند
          },
        },
        include: {
          cart: true, // شامل اطلاعات جدول Cart برای دسترسی به جزئیات
        },
      });

      for (const cartTerm of cartTerms) {
        // محاسبه مقدار تخفیف به درصد تبدیل شده
        const termDiscountAmount = (term.price * (term.discount || 0)) / 100;

        // به‌روزرسانی جدول `Cart`
        await prisma.cart.update({
          where: { id: cartTerm.cartId },
          data: {
            totalPrice: {
              decrement: term.price, // کاهش قیمت ترم از جمع کل
            },
            totalDiscount: {
              decrement: termDiscountAmount, // کاهش تخفیف ترم از تخفیف کل
            },
          },
        });
      }

      // حذف داده‌ها از جدول `CartTerm`
      await prisma.cartTerm.deleteMany({
        where: { termId },
      });

      // حذف داده‌ها از جدول `UserTerm`
      await prisma.userTerm.deleteMany({
        where: { termId },
      });

      // حذف داده‌ها از جدول `CourseTerm`
      await prisma.courseTerm.deleteMany({
        where: { termId },
      });

      // حذف داده‌ها از جدول `Session`
      await prisma.session.deleteMany({
        where: { termId },
      });

      // در نهایت حذف ترم از جدول `Term`
      await prisma.term.delete({
        where: { id: termId },
      });
    });

    return NextResponse.json({ message: 'ترم با موفقیت حذف شد.' });
  } catch (error) {
    console.error('Error deleting term:', error);
    return NextResponse.json(
      { error: 'مشکلی در حذف ترم وجود دارد.' },
      { status: 500 },
    );
  }
}
