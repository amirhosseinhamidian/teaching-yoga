import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    const article = await prismadb.article.findUnique({
      where: {
        shortAddress,
        isActive: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 400 }
      );
    }

    const normalizedArticle = {
      ...article,
      cover: toAbsoluteMediaUrl(article.cover),
    };

    return NextResponse.json(normalizedArticle, { status: 200 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
