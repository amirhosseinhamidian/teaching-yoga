import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET() {
  try {
    const courses = await prismadb.course.findMany({
      select: {
        id: true,
        title: true,
        cover: true,
        sessionCount: true,
        participants: true,
        activeStatus: true,
        courseTerms: {
          select: {
            term: {
              select: {
                price: true,
                discount: true,
              },
            },
          },
        },
      },
    });

    const coursesWithDetails = courses.map((course) => {
      const termCount = course.courseTerms.length;

      const totalPrice = course.courseTerms.reduce(
        (sum, courseTerm) => sum + courseTerm.term.price,
        0
      );

      const totalDiscount = course.courseTerms.reduce(
        (sum, courseTerm) => sum + (courseTerm.term.discount || 0),
        0
      );

      const averageDiscount =
        termCount > 0 ? Math.ceil(totalDiscount / termCount) : 0;

      return {
        ...course,
        cover: toAbsoluteMediaUrl(course.cover),
        termCount,
        totalPrice,
        averageDiscount,
      };
    });

    return NextResponse.json(coursesWithDetails, {
      status: 200,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: 'Something went wrong',
      },
      {
        status: 500,
      }
    );
  }
}
