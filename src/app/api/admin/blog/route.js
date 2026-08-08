import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Number(searchParams.get('page')) || 1;
    const perPage = 10;
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * perPage;

    const where = {
      title: {
        contains: search,
        mode: 'insensitive',
      },
    };

    const totalArticles = await prismadb.article.count({
      where,
    });

    const articles = await prismadb.article.findMany({
      where,
      include: {
        comments: true,
      },
      skip,
      take: perPage,
      orderBy: {
        createAt: 'desc',
      },
    });

    const articlesWithVisits = await Promise.all(
      articles.map(async (article) => {
        const visitCount = await prismadb.visitLog.count({
          where: {
            pageUrl: `/articles/${article.shortAddress}`,
          },
        });

        return {
          ...article,
          cover: toAbsoluteMediaUrl(article.cover),
          visitCount,
        };
      })
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
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'خطایی رخ داده است',
        error,
      },
      { status: 500 }
    );
  }
}

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
        {
          message: 'عنوان و محتوا الزامی هستند',
        },
        { status: 400 }
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
        isActive: isActive ?? false,
      },
    });

    return NextResponse.json(
      {
        ...newArticle,
        cover: toAbsoluteMediaUrl(newArticle.cover),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: 'خطایی رخ داده است',
        error,
      },
      { status: 500 }
    );
  }
}
