import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type'); // تعیین نوع نظرات: 'course' یا 'article'

    // شرط‌های فیلتر
    const filters = {
      parentId: null, // فقط نظرات اصلی (نه پاسخ‌ها)
    };

    if (type === 'course') {
      filters.courseId = {
        not: null, // فقط نظراتی که courseId مقدار دارد
      };
    } else if (type === 'article') {
      filters.articleId = {
        not: null, // فقط نظراتی که articleId مقدار دارد
      };
    }

    // تعداد کل نظرات
    const totalComments = await prismadb.comment.count({
      where: filters,
    });

    // تعداد نظرات تأیید شده
    const approvedComments = await prismadb.comment.count({
      where: {
        ...filters,
        status: 'APPROVED',
      },
    });

    // تعداد نظرات 30 روز گذشته
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

    const recentComments = await prismadb.comment.count({
      where: {
        ...filters,
        createAt: {
          gte: date30DaysAgo,
        },
      },
    });

    return NextResponse.json({
      totalComments,
      approvedComments,
      recentComments,
    });
  } catch (error) {
    console.error('Error fetching comments data:', error);
    return NextResponse.json(
      { error: 'مشکلی در پردازش درخواست وجود دارد.' },
      { status: 500 },
    );
  }
}
