/* eslint-disable no-undef */
import { generateTemporaryLink } from '@/app/actions/generateTemporaryLink';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    // Fetch course details from the database
    const course = await prismadb.course.findUnique({
      where: {
        shortAddress: shortAddress,
        activeStatus: true,
      },
      include: {
        instructor: {
          include: {
            user: true,
          },
        },
        courseTerms: {
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: {
                    session: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 400 },
      );
    }

    // 🔄 تبدیل sessionTerms → sessions[] مانند ساختار قدیم
    course.courseTerms.forEach((ct) => {
      const term = ct.term;

      term.sessions = term.sessionTerms
        .map((st) => st.session)
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);
    });

    // استخراج ترم‌ها برای محاسبه قیمت
    const terms = course.courseTerms.map((courseTerm) => courseTerm.term) || [];

    const totalPrice = terms.reduce((sum, term) => sum + (term.price || 0), 0);

    const totalDiscount = terms.reduce(
      (sum, term) => sum + (term.discount || 0),
      0,
    );

    const averageDiscount =
      terms.length > 0 ? Math.ceil(totalDiscount / terms.length) : 0;

    const finalPrice = terms.reduce((sum, term) => {
      const termPrice = term.price || 0;
      const termDiscount = term.discount || 0;
      const discountedPrice = termPrice - (termPrice * termDiscount) / 100;
      return sum + discountedPrice;
    }, 0);

    // اضافه کردن مقادیر محاسبه شده
    const responseData = {
      ...course,
      price: totalPrice,
      discount: averageDiscount,
      finalPrice,
    };

    // اگر ویدیو معرفی دارد لینک موقت بساز
    if (course.introVideoUrl) {
      const signedUrl = await generateTemporaryLink(course.introVideoUrl);
      responseData.introLink = signedUrl;
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}