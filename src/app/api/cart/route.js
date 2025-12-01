/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { buildCartResponse } from '@/utils/buildCartResponse';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = getAuthUser();

    // کاربر وارد نشده → cart خالی
    if (!user) {
      return NextResponse.json(
        {
          cart: {
            id: null,
            courses: [],
            totalPrice: 0,
            totalDiscount: 0,
            totalPriceWithoutDiscount: 0,
            discountAmount: 0,
          },
        },
        { status: 200 }
      );
    }

    const userId = user.id;

    // تولید خروجی استاندارد سبد خرید
    const cartResponse = await buildCartResponse(userId);

    return NextResponse.json(cartResponse, { status: 200 });
  } catch (error) {
    console.error('Error GET CART:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user)
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );

    const { courseId } = await req.json();
    const userId = user.id;

    if (!courseId)
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );

    // بررسی خرید قبلی
    const bought = await prismadb.userCourse.findFirst({
      where: { userId, courseId: Number(courseId) },
    });

    if (bought) {
      return NextResponse.json(
        { message: 'شما قبلاً این دوره را تهیه کرده‌اید.' },
        { status: 400 }
      );
    }

    // دریافت یا ایجاد cart
    let cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!cart) {
      cart = await prismadb.cart.create({
        data: { userId, status: 'PENDING' },
      });
    }

    // بررسی وجود دوره در cart
    const existing = await prismadb.cartCourse.findFirst({
      where: { cartId: cart.id, courseId: Number(courseId) },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'این دوره قبلاً به سبد خرید اضافه شده است.' },
        { status: 400 }
      );
    }

    // افزودن course به cartCourse
    await prismadb.cartCourse.create({
      data: {
        cartId: cart.id,
        courseId: Number(courseId),
      },
    });

    // افزودن termهای دوره
    const courseTerms = await prismadb.courseTerm.findMany({
      where: { courseId: Number(courseId) },
      include: { term: true },
    });

    for (const ct of courseTerms) {
      const exists = await prismadb.cartTerm.findFirst({
        where: { cartId: cart.id, termId: ct.termId },
      });

      if (!exists) {
        await prismadb.cartTerm.create({
          data: {
            cartId: cart.id,
            termId: ct.termId,
            price: ct.term.price,
            discount: ct.term.discount,
          },
        });
      }
    }

    // برگرداندن cart کامل
    const response = await buildCartResponse(userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal error', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = getAuthUser();
    if (!user)
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );

    const userId = user.id;
    const { courseId } = await req.json();

    if (!courseId)
      return NextResponse.json(
        { message: 'Course ID is required.' },
        { status: 400 }
      );

    const cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
      include: {
        cartCourses: true,
        cartTerms: {
          include: {
            term: {
              include: { courseTerms: true },
            },
          },
        },
      },
    });

    if (!cart)
      return NextResponse.json(
        { message: 'No pending cart found.' },
        { status: 404 }
      );

    // حذف دوره از cartCourses
    await prismadb.cartCourse.deleteMany({
      where: { cartId: cart.id, courseId: Number(courseId) },
    });

    // حذف termهای مرتبط (اگر shared نیستند)
    for (const ct of cart.cartTerms) {
      const shared = ct.term.courseTerms.some(
        (ct2) => ct2.courseId !== Number(courseId)
      );

      if (!shared) {
        await prismadb.cartTerm.delete({
          where: { id: ct.id },
        });
      }
    }

    // اگر سبد خالی شد → حذف cart
    const remainCourses = await prismadb.cartCourse.findMany({
      where: { cartId: cart.id },
    });

    const remainTerms = await prismadb.cartTerm.findMany({
      where: { cartId: cart.id },
    });

    if (remainCourses.length === 0 && remainTerms.length === 0) {
      await prismadb.cart.delete({
        where: { id: cart.id },
      });

      return NextResponse.json(
        {
          cart: {
            id: null,
            courses: [],
            totalPrice: 0,
            totalDiscount: 0,
            totalPriceWithoutDiscount: 0,
            discountAmount: 0,
          },
        },
        { status: 200 }
      );
    }

    // بازگرداندن cart کامل
    const response = await buildCartResponse(userId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('DELETE CART ERROR:', error);
    return NextResponse.json({ message: 'Internal error.' }, { status: 500 });
  }
}
