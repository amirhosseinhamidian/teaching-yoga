import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10); // صفحه فعلی
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد موارد در هر صفحه
    const skip = (page - 1) * perPage;
    const totalEpisode = await prismadb.podcastEpisode.count();

    const episodes = await prismadb.podcastEpisode.findMany({
      skip,
      take: perPage,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (episodes.length === 0) {
      return NextResponse.json(
        { message: 'No episodes found' },
        { status: 200 },
      );
    }

    return NextResponse.json({
      data: episodes,
      pagination: {
        total: totalEpisode,
        page,
        perPage,
        totalPages: Math.ceil(totalEpisode / perPage),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      podcastId,
      title,
      slug,
      description,
      audioUrl,
      duration,
      publishedAt,
      seasonNumber,
      episodeNumber,
      coverImageUrl,
      explicit,
      metaTitle,
      metaDescription,
      keywords,
    } = body;

    const createEpisode = await prismadb.podcastEpisode.create({
      data: {
        title,
        podcastId,
        slug,
        description,
        audioUrl,
        duration,
        publishedAt,
        seasonNumber,
        episodeNumber,
        coverImageUrl,
        explicit,
        metaTitle,
        metaDescription,
        keywords,
      },
    });

    // پاسخ با پادکست به‌روزرسانی شده
    return NextResponse.json(createEpisode);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update podcast' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // دریافت داده‌های درخواست
    const body = await request.json();

    const {
      id,
      podcastId,
      title,
      slug,
      description,
      audioUrl,
      duration,
      publishedAt,
      seasonNumber,
      episodeNumber,
      coverImageUrl,
      explicit,
      metaTitle,
      metaDescription,
      keywords,
    } = body;

    // ویرایش پادکست با استفاده از شناسه (id)
    const updatedEpisode = await prismadb.podcastEpisode.update({
      where: { id },
      data: {
        title,
        podcastId,
        slug,
        description,
        audioUrl,
        duration,
        publishedAt,
        seasonNumber,
        episodeNumber,
        coverImageUrl,
        explicit,
        metaTitle,
        metaDescription,
        keywords,
      },
    });

    // پاسخ با پادکست به‌روزرسانی شده
    return NextResponse.json(updatedEpisode);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update podcast' },
      { status: 500 },
    );
  }
}
