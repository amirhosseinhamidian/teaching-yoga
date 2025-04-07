import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    const podcast = await prismadb.podcast.findFirst();

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast' },
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
      title,
      slug,
      description,
      logoUrl,
      bannerUrl,
      hostName,
      language,
      genre,
      websiteUrl,
      rssFeed,
      email,
      explicit,
      spotifyUrl,
      appleUrl,
      googleUrl,
      castboxUrl,
      otherLinks,
      metaTitle,
      metaDescription,
      keywords,
    } = body;

    // ویرایش پادکست با استفاده از شناسه (id)
    const updatedPodcast = await prismadb.podcast.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        logoUrl,
        bannerUrl,
        hostName,
        language,
        genre,
        websiteUrl,
        rssFeed,
        email,
        explicit,
        spotifyUrl,
        appleUrl,
        googleUrl,
        castboxUrl,
        otherLinks,
        metaTitle,
        metaDescription,
        keywords,
      },
    });

    // پاسخ با پادکست به‌روزرسانی شده
    return NextResponse.json(updatedPodcast);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update podcast' },
      { status: 500 },
    );
  }
}
