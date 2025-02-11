import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type'); // course یا article
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const search = searchParams.get('search')?.trim(); // متن جستجو
    const status = searchParams.get('status'); // وضعیت نظر

    // بررسی مقدار type
    if (!type || (type !== 'course' && type !== 'article')) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 },
      );
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    // فیلتر کردن کامنت‌ها بر اساس نوع و وضعیت
    const whereClause = {
      parentId: null, // فقط کامنت‌های اصلی
      courseId: type === 'course' ? { not: null } : null, // دوره‌ها
      articleId: type === 'article' ? { not: null } : null, // مقالات
      status: status && status !== 'ALL' ? status : undefined, // وضعیت نظر
      OR: search
        ? [
            { content: { contains: search, mode: 'insensitive' } }, // جستجو در متن پیام
            {
              user: {
                OR: [
                  { username: { contains: search, mode: 'insensitive' } }, // جستجو در نام کاربری
                  { firstname: { contains: search, mode: 'insensitive' } }, // جستجو در نام کوچک
                  { lastname: { contains: search, mode: 'insensitive' } }, // جستجو در نام خانوادگی
                ],
              },
            },
          ]
        : undefined, // اگر متنی وارد نشده بود، جستجو اعمال نشود
    };

    // دریافت تعداد کل کامنت‌ها برای محاسبه تعداد صفحات
    const totalComments = await prismadb.comment.count({ where: whereClause });

    // دریافت لیست کامنت‌ها
    const comments = await prismadb.comment.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        content: true,
        userId: true,
        courseId: true,
        articleId: true,
        status: true,
        createAt: true,
        updatedAt: true,
        user: {
          select: {
            avatar: true,
            username: true,
            firstname: true,
            lastname: true,
          },
        },
        course:
          type === 'course'
            ? {
                // نمایش اطلاعات دوره فقط برای درخواست نوع course
                select: {
                  title: true,
                },
              }
            : undefined,
        article:
          type === 'article'
            ? {
                // نمایش اطلاعات مقاله فقط برای درخواست نوع article
                select: {
                  title: true,
                },
              }
            : undefined,
        replies: {
          select: {
            id: true,
            content: true,
            createAt: true,
          },
        },
      },
    });

    // محاسبه تعداد صفحات
    const totalPages = Math.ceil(totalComments / perPage);

    return NextResponse.json({
      comments,
      pagination: {
        totalComments,
        totalPages,
        currentPage: page,
        perPage,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching comments' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // گرفتن ID از هدر درخواست
    const commentId = request.headers.get('id');
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 },
      );
    }

    // حذف پاسخ‌های مربوطه و کامنت اصلی
    await prismadb.$transaction(async (prisma) => {
      // حذف تمام پاسخ‌هایی که parentId برابر با commentId دارند
      await prisma.comment.deleteMany({
        where: {
          parentId: parseInt(commentId),
        },
      });

      // حذف کامنت اصلی
      await prisma.comment.delete({
        where: {
          id: parseInt(commentId),
        },
      });
    });

    return NextResponse.json({
      message: 'کامنت با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'خطای ناشناخته در حذف کامنت' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    // دریافت داده‌های ورودی از بدنه درخواست
    const body = await request.json();
    const { content, userId, parentId, courseId, articleId } = body;

    // اعتبارسنجی ورودی‌ها
    if (!content || !userId || !parentId) {
      return NextResponse.json(
        { error: 'Content, userId, and parentId are required' },
        { status: 400 },
      );
    }

    // بررسی اینکه باید courseId یا articleId وجود داشته باشد
    if (!courseId && !articleId) {
      return NextResponse.json(
        { error: 'Either courseId or articleId must be provided' },
        { status: 400 },
      );
    }

    // ایجاد ریپلای جدید
    const newReply = await prismadb.comment.create({
      data: {
        content,
        userId,
        parentId,
        courseId: courseId || null, // اگر وجود نداشت، مقدار null قرار می‌گیرد
        articleId: articleId || null,
        status: 'APPROVED', // وضعیت پیش‌فرض
      },
    });

    return NextResponse.json(newReply, { status: 201 });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the reply' },
      { status: 500 },
    );
  }
}
