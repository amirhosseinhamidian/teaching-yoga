import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    // دریافت داده‌های ورودی از درخواست
    const body = await request.json();
    const { userId, courseId } = body;

    // بررسی ورودی‌ها
    if (!userId || !courseId) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر و شناسه دوره الزامی است',
        },
        { status: 400 },
      );
    }

    // بررسی وجود کاربر
    const user = await prismadb.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'کاربر یافت نشد',
        },
        { status: 404 },
      );
    }

    // بررسی وجود دوره
    const course = await prismadb.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        {
          error: 'دوره یافت نشد',
        },
        { status: 404 },
      );
    }

    // بررسی اینکه کاربر قبلاً این دوره را ثبت نکرده باشد
    const existingRecord = await prismadb.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (existingRecord) {
      return NextResponse.json(
        {
          error: 'کاربر قبلاً در این دوره ثبت‌نام کرده است',
        },
        { status: 400 },
      );
    }

    // ثبت دوره برای کاربر
    const userCourse = await prismadb.userCourse.create({
      data: {
        userId: userId,
        courseId: courseId,
      },
    });

    return NextResponse.json(
      {
        message: 'دوره با موفقیت برای کاربر ثبت شد',
        userCourse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('خطا در ثبت دوره برای کاربر:', error);
    return NextResponse.json(
      {
        error: 'ثبت دوره با شکست مواجه شد',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر و شناسه دوره الزامی است',
        },
        { status: 400 },
      );
    }

    // حذف اطلاعات از جدول sessionProgress
    await prismadb.sessionProgress.deleteMany({
      where: {
        userId: userId,
        session: {
          term: {
            courseTerms: {
              some: {
                courseId: courseId,
              },
            },
          },
        },
      },
    });

    // حذف اطلاعات از جدول userCourse
    await prismadb.userCourse.delete({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'اطلاعات دوره برای کاربر با موفقیت حذف شد',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('خطا در حذف اطلاعات دوره:', error);
    return NextResponse.json(
      {
        error: 'حذف اطلاعات دوره با شکست مواجه شد',
      },
      { status: 500 },
    );
  }
}
