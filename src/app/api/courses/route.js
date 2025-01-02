import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const onlyLastThree = url.searchParams.get('lastThree') === 'true'; // بررسی کوئری پارامتر

    const courses = await prismadb.course.findMany({
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
      orderBy: [
        { isHighPriority: 'desc' }, // مرتب‌سازی بر اساس اولویت بالا
        { id: 'desc' }, // مرتب‌سازی نزولی بر اساس ID برای شناسایی سه دوره آخر
      ],
      take: onlyLastThree ? 3 : undefined, // محدود کردن نتایج به 3 دوره آخر در صورت درخواست
    });

    // محاسبه قیمت کل و میانگین تخفیف برای هر دوره
    const coursesWithPrices = courses.map((course) => {
      const termCount = course.courseTerms.length;

      // محاسبه مجموع قیمت کل ترم‌ها
      const totalPrice = course.courseTerms.reduce((sum, courseTerm) => {
        return sum + courseTerm.term.price;
      }, 0);

      // محاسبه مجموع درصد تخفیف
      const totalDiscount = course.courseTerms.reduce((sum, courseTerm) => {
        return sum + (courseTerm.term.discount || 0);
      }, 0);

      // محاسبه میانگین درصد تخفیف
      const averageDiscount =
        termCount > 0 ? Math.ceil(totalDiscount / termCount) : 0;

      // محاسبه مجموع قیمت نهایی پس از اعمال تخفیف روی هر ترم
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
        cover: course.cover,
        shortAddress: course.shortAddress,
        price: totalPrice, // مجموع قیمت دوره
        discount: averageDiscount, // میانگین تخفیف دوره
        finalPrice: Math.ceil(finalPrice), // قیمت نهایی دوره (بعد از اعمال تخفیف)
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: coursesWithPrices,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses. Please try again later.',
      },
      { status: 500 },
    );
  }
}
