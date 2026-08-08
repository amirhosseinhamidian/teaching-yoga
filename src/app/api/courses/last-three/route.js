import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const courses = await prismadb.course.findMany({
      where: { activeStatus: true },
      select: {
        id: true,
        title: true,
        subtitle: true,
        isHighPriority: true,
        cover: true,
        shortAddress: true,
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
      orderBy: [{ isHighPriority: 'desc' }, { id: 'desc' }],
      take: 3,
    });

    const coursesWithPrices = courses.map((course) => {
      const termCount = course.courseTerms.length;

      const totalPrice = course.courseTerms.reduce((sum, courseTerm) => {
        return sum + courseTerm.term.price;
      }, 0);

      const totalDiscount = course.courseTerms.reduce((sum, courseTerm) => {
        return sum + (courseTerm.term.discount || 0);
      }, 0);

      const averageDiscount =
        termCount > 0 ? Math.ceil(totalDiscount / termCount) : 0;

      const finalPrice = course.courseTerms.reduce((sum, courseTerm) => {
        const discountPercentage = courseTerm.term.discount || 0;

        const discountedPrice =
          courseTerm.term.price * (1 - discountPercentage / 100);

        return sum + discountedPrice;
      }, 0);

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        isHighPriority: course.isHighPriority,

        // فقط خروجی تبدیل می‌شود
        cover: toAbsoluteMediaUrl(course.cover),

        shortAddress: course.shortAddress,
        price: totalPrice,
        discount: averageDiscount,
        finalPrice: Math.ceil(finalPrice),
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: coursesWithPrices,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching courses:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses. Please try again later.',
      },
      { status: 500 }
    );
  }
}
