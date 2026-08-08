import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const onlyLastThree = searchParams.get('lastThree') === 'true';

    const articles = await prismadb.article.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        subtitle: true,
        cover: true,
        shortAddress: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: onlyLastThree ? 3 : undefined,
    });

    const normalizedArticles = articles.map((article) => ({
      ...article,
      cover: toAbsoluteMediaUrl(article.cover),
    }));

    return NextResponse.json({
      success: true,
      data: normalizedArticles,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles. Please try again later.',
      },
      { status: 500 }
    );
  }
}
