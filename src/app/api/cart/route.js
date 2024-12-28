import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to ask a question.' },
        { status: 401 },
      );
    }
    const userId = session.user.userId;

    // پیدا کردن سبد خرید کاربر با وضعیت PENDING
    const cart = await prismadb.cart.findFirst({
      where: {
        userId: userId,
        status: 'PENDING',
      },
      include: {
        cartTerms: {
          include: {
            term: {
              include: {
                courseTerms: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        cover: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ message: 'No pending cart found', cart });
    }

    // ایجاد یک Map برای جلوگیری از تکرار دوره‌ها
    const coursesMap = new Map();
    let totalDiscount = 0;
    let totalPrice = 0;
    let totalPriceWithoutDiscount = 0;

    cart.cartTerms.forEach((cartTerm) => {
      const course = cartTerm.term.courseTerms[0]?.course;

      if (!course) return;

      const termPrice = cartTerm.price;
      const discount = cartTerm.discount || 0;

      // محاسبه مبلغ تخفیف و قیمت نهایی ترم
      const discountAmount = (termPrice * discount) / 100;
      const finalTermPrice = termPrice - discountAmount;

      totalDiscount += discountAmount;
      totalPrice += finalTermPrice;
      totalPriceWithoutDiscount += termPrice;

      if (!coursesMap.has(course.id)) {
        coursesMap.set(course.id, {
          courseId: course.id,
          courseTitle: course.title,
          courseCoverImage: course.cover,
          finalPrice: 0,
          discount: 0,
          finalPriceWithoutDiscount: 0,
        });
      }

      const courseInfo = coursesMap.get(course.id);
      courseInfo.finalPrice += finalTermPrice;
      courseInfo.discount += discountAmount;
      courseInfo.finalPriceWithoutDiscount += termPrice;
    });

    // تبدیل Map به آرایه
    const coursesInfo = Array.from(coursesMap.values());

    return NextResponse.json({
      cart: {
        id: cart.id,
        totalPrice,
        totalDiscount,
        totalPriceWithoutDiscount,
        courses: coursesInfo,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'برای افزودن دوره ابتدا باید وارد حساب کاربری خود شوید.' },
        { status: 401 },
      );
    }

    const userId = session.user.userId;

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 },
      );
    }

    // پیدا کردن سبد خرید کاربر در وضعیت PENDING
    let cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
    });

    // اگر سبد خرید وجود نداشت، ایجاد آن
    if (!cart) {
      cart = await prismadb.cart.create({
        data: { userId, status: 'PENDING' },
      });
    }

    // پیدا کردن ترم‌های دوره
    const courseTerms = await prismadb.courseTerm.findMany({
      where: { courseId: parseInt(courseId) },
      include: { term: true },
    });

    if (!courseTerms.length) {
      return NextResponse.json(
        { message: 'Course terms not found' },
        { status: 404 },
      );
    }

    // بررسی وجود ترم‌های دوره در سبد خرید
    const existingCartTerms = await prismadb.cartTerm.findMany({
      where: {
        cartId: cart.id,
        termId: {
          in: courseTerms.map((ct) => ct.termId), // لیست شناسه‌های ترم‌های دوره
        },
      },
    });

    if (existingCartTerms.length > 0) {
      return NextResponse.json(
        { message: 'این دوره قبلا به سبد خرید شما اضافه شده است.' },
        { status: 400 },
      );
    }

    // افزودن ترم‌های جدید به سبد خرید
    const newCartTerms = courseTerms.map((ct) => ({
      cartId: cart.id,
      termId: ct.termId,
      price: ct.term.price,
      discount: ct.term.discount,
    }));

    await prismadb.cartTerm.createMany({
      data: newCartTerms,
    });

    // محاسبه قیمت و تخفیف جدید سبد خرید
    const updatedCartTerms = await prismadb.cartTerm.findMany({
      where: { cartId: cart.id },
      include: { term: true },
    });

    const totalPrice = updatedCartTerms.reduce((acc, ct) => acc + ct.price, 0);
    const totalDiscount = updatedCartTerms.reduce(
      (acc, ct) => acc + (ct.price * (ct.discount || 0)) / 100,
      0,
    );

    // بروزرسانی اطلاعات قیمت سبد خرید
    await prismadb.cart.update({
      where: { id: cart.id },
      data: {
        totalPrice,
        totalDiscount,
      },
    });

    return NextResponse.json({
      message: 'دوره به سبد خرید شما اضافه شد.',
      cart: {
        id: cart.id,
        userId: cart.userId,
        status: cart.status,
        totalPrice,
        totalDiscount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to remove an item.' },
        { status: 401 },
      );
    }

    const userId = session.user.userId;

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required.' },
        { status: 400 },
      );
    }

    // پیدا کردن سبد خرید PENDING کاربر
    const cart = await prismadb.cart.findFirst({
      where: {
        userId: userId,
        status: 'PENDING',
      },
      include: {
        cartTerms: {
          include: {
            term: {
              include: {
                courseTerms: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: 'No pending cart found.' },
        { status: 404 },
      );
    }

    // پیدا کردن cartTerm های مرتبط با courseId
    const cartTermsToDelete = cart.cartTerms.filter((cartTerm) => {
      const courseTempId = cartTerm.term.courseTerms[0]?.courseId;
      return courseTempId === courseId;
    });

    if (cartTermsToDelete.length === 0) {
      return NextResponse.json(
        { message: 'Course not found in the cart.' },
        { status: 404 },
      );
    }

    // حذف cartTerm های مرتبط
    const deletePromises = cartTermsToDelete.map((cartTerm) =>
      prismadb.cartTerm.delete({
        where: { id: cartTerm.id },
      }),
    );
    await Promise.all(deletePromises);

    // بررسی خالی بودن سبد خرید و حذف آن در صورت نیاز
    const remainingCartTerms = await prismadb.cartTerm.findMany({
      where: { cartId: cart.id },
    });

    if (remainingCartTerms.length === 0) {
      await prismadb.cart.delete({
        where: { id: cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Course removed from the cart successfully.',
    });
  } catch (error) {
    console.error('Error removing course from cart:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
