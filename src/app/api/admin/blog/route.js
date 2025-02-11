import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Number(searchParams.get('page')) || 1;
    const perPage = 10;
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * perPage;

    const totalArticles = await prismadb.article.count({
      where: {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    const articles = await prismadb.article.findMany({
      where: {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      include: { comments: true },
      skip,
      take: perPage,
      orderBy: { createAt: 'desc' },
    });

    // دریافت تعداد بازدیدها برای هر مقاله
    const articlesWithVisits = await Promise.all(
      articles.map(async (article) => {
        const visitCount = await prismadb.visitLog.count({
          where: {
            pageUrl: `/articles/${article.shortAddress}`,
          },
        });

        return {
          ...article,
          visitCount, // اضافه کردن تعداد بازدید
        };
      }),
    );

    return NextResponse.json(
      {
        data: articlesWithVisits,
        pagination: {
          total: totalArticles,
          page,
          perPage,
          totalPages: Math.ceil(totalArticles / perPage),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'خطایی رخ داده است', error },
      { status: 500 },
    );
  }
}

// ایجاد مقاله جدید (POST)
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      cover,
      readTime,
      subtitle,
      shortAddress,
      isActive,
    } = body;

    if (
      !title ||
      !content ||
      !cover ||
      !readTime ||
      !subtitle ||
      !shortAddress
    ) {
      return NextResponse.json(
        { message: 'عنوان و محتوا الزامی هستند' },
        { status: 400 },
      );
    }

    const newArticle = await prismadb.article.create({
      data: {
        title,
        content,
        cover,
        shortAddress,
        readTime,
        subtitle,
        isActive: isActive ?? false, // مقدار پیش‌فرض false است
      },
    });

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'خطایی رخ داده است', error },
      { status: 500 },
    );
  }
}
