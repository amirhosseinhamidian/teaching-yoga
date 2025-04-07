import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }
  try {
    const episode = await prismadb.podcastEpisode.findUnique({
      where: { id },
    });
    if (!episode) {
      return NextResponse.json({ error: 'اپیزود پیدا نشد!' }, { status: 404 });
    }
    return NextResponse.json(episode, { status: 200 });
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'خطای ناشناخته در ارسال اطلاعات اپیزود' },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه اپیزود مورد نظر مشخص نشده است' },
        { status: 400 },
      );
    }

    // حذف اپیزود با استفاده از شناسه (id)
    const deletedEpisode = await prismadb.podcastEpisode.delete({
      where: { id },
    });

    // ارسال پاسخ با اپیزود حذف شده
    return NextResponse.json(deletedEpisode);
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 },
    );
  }
}
