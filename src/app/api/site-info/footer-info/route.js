import prisma from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // دریافت دوره‌ها
    const courses = await prisma.course.findMany({
      select: {
        title: true,
        shortAddress: true,
      },
    });

    // دریافت مقالات
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    // فرمت‌دهی اطلاعات برای دراپ‌دان
    const coursesDropdown = courses.map((course) => ({
      label: course.title,
      value: course.shortAddress,
    }));

    const articlesDropdown = articles.map((article) => ({
      label: article.title,
      value: article.id,
    }));

    // ارسال اطلاعات به صورت JSON
    return NextResponse.json({
      courses: coursesDropdown,
      articles: articlesDropdown,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
