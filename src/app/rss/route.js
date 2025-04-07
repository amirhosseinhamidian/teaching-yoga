import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { generatePodcastRss } from '@/libs/rss/generatePodcastRss';

export async function GET() {
  try {
    const podcast = await prismadb.podcast.findFirst({
      include: {
        episodes: {
          where: {
            isDraft: false,
            publishedAt: {
              lte: new Date(), // فقط اپیزودهای منتشرشده
            },
          },
        },
      },
    });

    if (!podcast) {
      return new NextResponse('Podcast not found', { status: 404 });
    }

    const rss = generatePodcastRss(podcast);

    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 's-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
}
