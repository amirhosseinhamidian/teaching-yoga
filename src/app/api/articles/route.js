import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const onlyLastThree = url.searchParams.get('lastThree') === 'true';
    const articles = await prismadb.article.findMany({
      select: {
        id: true,
        title: true,
        subtitle: true,
        cover: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: onlyLastThree ? 3 : undefined,
    });
    return NextResponse.json(
      {
        success: true,
        data: articles,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch articles. Please try again later.',
      },
      { status: 500 },
    );
  }
}
