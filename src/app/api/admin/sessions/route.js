import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // استخراج Query Parameters
    const { searchParams } = request.nextUrl;
    const termId = parseInt(searchParams.get('termId') || '-1', 10); // فیلتر بر اساس ترم
    const courseId = parseInt(searchParams.get('courseId') || '-1', 10); // فیلتر بر اساس دوره
    const search = searchParams.get('search'); // جستجو در نام جلسات
    const page = parseInt(searchParams.get('page') || '1', 10); // شماره صفحه
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد آیتم‌ها در هر صفحه

    // محاسبه محدودیت‌ها برای Pagination
    const skip = (page - 1) * perPage;

    // تنظیم شرط‌ها برای فیلتر و جستجو
    const whereConditions = {
      AND: [
        termId !== -1 ? { termId } : {}, // فیلتر ترم (در صورت مشخص بودن)
        courseId !== -1
          ? {
              term: {
                courseTerms: {
                  some: {
                    courseId,
                  },
                },
              },
            }
          : {}, // فیلتر دوره (در صورت مشخص بودن)
        search
          ? {
              name: {
                contains: search, // جستجو در نام جلسات
                mode: 'insensitive', // جستجوی غیر حساس به حروف کوچک و بزرگ
              },
            }
          : {}, // جستجو در نام جلسات
      ],
    };

    // دریافت جلسات از پایگاه داده
    const sessions = await prismadb.session.findMany({
      where: whereConditions,
      skip, // شروع از آیتم مشخص
      take: perPage, // تعداد آیتم‌ها در هر صفحه
      include: {
        video: true, // اطلاعات ویدیو
        term: {
          include: {
            courseTerms: {
              include: {
                course: {
                  select: {
                    title: true, // عنوان دوره
                  },
                },
              },
            },
          },
        },
      },
    });

    // شمارش تعداد کل جلسات برای Pagination
    const totalCount = await prismadb.session.count({
      where: whereConditions,
    });

    // فلت کردن داده‌ها
    const flattenedData = sessions.map((session) => ({
      sessionId: session.id,
      sessionName: session.name,
      sessionDuration: session.duration,
      sessionIsFree: session.isFree,
      sessionIsActive: session.isActive,
      videoKey: session.video?.videoKey || null, // کلید ویدیو
      videoId: session.video?.id || null,
      videoAccessLevel: session.video?.accessLevel || null,
      videoCreatedAt: session.video?.createAt || null, // تاریخ ایجاد ویدیو
      termId: session.term.id,
      termName: session.term.name,
      courseTitles: session.term.courseTerms
        .map((courseTerm) => courseTerm.course.title)
        .join(', '), // عنوان دوره‌ها به صورت کاما جدا شده
    }));

    // ارسال پاسخ
    return NextResponse.json({
      message: 'اطلاعات با موفقیت بارگذاری شد.',
      data: flattenedData,
      pagination: {
        currentPage: page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage), // تعداد کل صفحات
      },
    });
  } catch (error) {
    console.error('Error fetching paginated sessions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات.' },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const { sessionId, termId, name, duration, accessLevel } = await req.json();

    // اعتبارسنجی داده‌های ورودی
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه جلسه معتبر نیست.' },
        { status: 400 },
      );
    }

    if (!termId || typeof termId !== 'number') {
      return NextResponse.json(
        { error: 'شناسه ترم معتبر نیست.' },
        { status: 400 },
      );
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 },
      );
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان باید عددی معتبر باشد.' },
        { status: 400 },
      );
    }

    if (
      !accessLevel ||
      !['PUBLIC', 'REGISTERED', 'PURCHASED'].includes(accessLevel)
    ) {
      return NextResponse.json(
        { error: 'سطح دسترسی ویدیو معتبر نیست.' },
        { status: 400 },
      );
    }

    // بروزرسانی جلسه در دیتابیس
    const updatedSession = await prismadb.session.update({
      where: {
        id: sessionId, // شناسه جلسه
      },
      data: {
        name,
        duration,
        term: {
          connect: { id: termId }, // آپدیت ترم مرتبط
        },
        video: {
          update: {
            accessLevel,
          },
        },
      },
      include: {
        video: true,
        term: {
          select: {
            name: true, // بازگرداندن فقط نام ترم
          },
        },
      },
    });
    return NextResponse.json(
      { message: 'جلسه با موفقیت بروزرسانی شد.', updatedSession },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی جلسه.' },
      { status: 500 },
    );
  }
}
