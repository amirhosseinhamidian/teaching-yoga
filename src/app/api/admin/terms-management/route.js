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
    const { searchParams } = request.nextUrl;
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
        { status: 400 }
      );
    }

    await prismadb.$transaction(async (prisma) => {
      // ---------------------------
      // 1) دریافت ترم
      // ---------------------------
      const term = await prisma.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        throw new Error('ترم پیدا نشد.');
      }

      // ---------------------------
      // 2) دریافت Session های این ترم از طریق SessionTerm
      // ---------------------------
      const sessionLinks = await prisma.sessionTerm.findMany({
        where: { termId },
        select: { sessionId: true },
      });

      const sessionIds = sessionLinks.map((s) => s.sessionId);

      // ---------------------------
      // 3) حذف SessionProgress ها
      // ---------------------------
      if (sessionIds.length > 0) {
        await prisma.sessionProgress.deleteMany({
          where: {
            sessionId: { in: sessionIds },
          },
        });
      }

      // ---------------------------
      // 4) حذف SessionVideo و SessionAudio
      // ---------------------------
      if (sessionIds.length > 0) {
        const sessions = await prisma.session.findMany({
          where: { id: { in: sessionIds } },
          include: { video: true, audio: true },
        });

        for (const s of sessions) {
          if (s.video) {
            await prisma.sessionVideo.delete({
              where: { id: s.video.id },
            });
          }

          if (s.audio) {
            await prisma.sessionAudio.delete({
              where: { id: s.audio.id },
            });
          }
        }
      }

      // ---------------------------
      // 5) حذف SessionTerm (اتصال جلسات به ترم)
      // ---------------------------
      await prisma.sessionTerm.deleteMany({
        where: { termId },
      });

      // ---------------------------
      // 6) حذف Sessions
      // ---------------------------
      if (sessionIds.length > 0) {
        await prisma.session.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      // ---------------------------
      // 7) حذف CourseTerm
      // ---------------------------
      await prisma.courseTerm.deleteMany({
        where: { termId },
      });

      // ---------------------------
      // 8) حذف CartTerm (سبد خرید)
      // ---------------------------
      await prisma.cartTerm.deleteMany({
        where: { termId },
      });

      // ---------------------------
      // 9) حذف UserTerm (اگر مدل حذف شده، این خط حذف می‌شود)
      // ---------------------------
      try {
        await prisma.userTerm.deleteMany({
          where: { termId },
        });
      } catch (e) {
        // اگر مدل حذف شده باشد هیچ کاری نمی‌کنیم
      }

      // ---------------------------
      // 10) حذف خود Term
      // ---------------------------
      await prisma.term.delete({
        where: { id: termId },
      });
    });

    return NextResponse.json({ message: 'ترم با موفقیت حذف شد.' });
  } catch (error) {
    console.error('Error deleting term:', error);
    return NextResponse.json(
      { error: 'مشکلی در حذف ترم وجود دارد.' },
      { status: 500 }
    );
  }
}