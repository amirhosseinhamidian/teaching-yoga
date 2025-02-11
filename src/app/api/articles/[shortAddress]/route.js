import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    // Fetch course details from the database
    const article = await prismadb.article.findUnique({
      where: {
        shortAddress,
        isActive: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'Article not found' },
        { status: 400 },
      );
    }

    return NextResponse.json(article, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
