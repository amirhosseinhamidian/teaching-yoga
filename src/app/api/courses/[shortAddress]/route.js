/* eslint-disable no-undef */
import { generateTemporaryLink } from '@/app/actions/generateTemporaryLink';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    // Fetch course details from the database
    const course = await prismadb.course.findFirst({
      where: {
        shortAddress,
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
        { status: 404 }
      );
    }

    // 🔄 تبدیل sessionTerms → sessions[] مانند ساختار قدیم
    course.courseTerms.forEach((ct) => {
      const term = ct.term;
      if (!term) return;

      term.sessions = (term.sessionTerms || [])
        .map((st) => st.session)
        .filter(Boolean)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    // -----------------------------
    // ✅ محاسبه قیمت بر اساس همه ترم‌های دوره
    // (بدون توجه به isOptional)
    // -----------------------------
    const courseTerms = Array.isArray(course.courseTerms)
      ? course.courseTerms
      : [];

    // قیمت کل = جمع price ترم‌ها
    const totalPrice = courseTerms.reduce((sum, ct) => {
      const price = Number(ct?.term?.price ?? 0);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    // مجموع درصد تخفیف‌ها (برای محاسبه میانگین نمایشی)
    const totalDiscountPercent = courseTerms.reduce((sum, ct) => {
      const discount = Number(ct?.term?.discount ?? 0);
      return sum + (Number.isFinite(discount) ? discount : 0);
    }, 0);

    // میانگین درصد تخفیف (نمایشی)
    const averageDiscount =
      courseTerms.length > 0
        ? Math.ceil(totalDiscountPercent / courseTerms.length)
        : 0;

    // قیمت نهایی = جمع قیمت هر ترم بعد از اعمال درصد تخفیف همان ترم
    const finalPrice = courseTerms.reduce((sum, ct) => {
      const termPrice = Number(ct?.term?.price ?? 0);
      const termDiscount = Number(ct?.term?.discount ?? 0);

      const safePrice = Number.isFinite(termPrice) ? termPrice : 0;
      const safeDiscount = Number.isFinite(termDiscount) ? termDiscount : 0;

      const discountedPrice = safePrice - (safePrice * safeDiscount) / 100;
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
      { status: 500 }
    );
  }
}
