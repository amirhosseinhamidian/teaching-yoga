import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';
import { extractEmbeddedCourseSlugs } from '@/utils/articleCourseEmbeds';

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

    const embeddedCourseSlugs = extractEmbeddedCourseSlugs(article.content);
    const embeddedCourses = embeddedCourseSlugs.length
      ? await prismadb.course.findMany({
          where: {
            shortAddress: {
              in: embeddedCourseSlugs,
            },
            activeStatus: true,
          },
          select: {
            id: true,
            title: true,
            subtitle: true,
            cover: true,
            shortAddress: true,
          },
        })
      : [];

    const normalizedArticle = {
      ...article,
      cover: toAbsoluteMediaUrl(article.cover),
      embeddedCourses: embeddedCourses.map((course) => ({
        ...course,
        cover: toAbsoluteMediaUrl(course.cover),
      })),
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
