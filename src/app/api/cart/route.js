import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to view the cart.' },
        { status: 401 },
      );
    }

    const userId = session.user.userId;

    // دریافت سبد خرید کاربر
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
        cartCourses: {
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
    });

    // اگر سبد خرید پیدا نشد، مقدار خالی برگردانید
    if (!cart) {
      return NextResponse.json(
        {
          cart: {
            id: null,
            totalPrice: 0,
            totalDiscount: 0,
            totalPriceWithoutDiscount: 0,
            courses: [],
          },
        },
        { status: 200 },
      );
    }

    // دریافت دوره‌های خریداری‌شده توسط کاربر
    const purchasedCourses = await prismadb.userCourse.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
      },
      select: {
        courseId: true,
      },
    });

    const purchasedCourseIds = new Set(
      purchasedCourses.map((userCourse) => userCourse.courseId),
    );

    // ایجاد لیست ترم‌های مجاز (غیر تکراری)
    const termSet = new Set();
    cart.cartTerms.forEach((cartTerm) => {
      termSet.add(cartTerm.term.id);
    });

    // ایجاد ساختار برای ذخیره اطلاعات دوره‌ها
    const coursesMap = new Map();

    cart.cartCourses.forEach((cartCourse) => {
      const course = cartCourse.course;

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

      // محاسبه قیمت و تخفیف دوره از ترم‌های مرتبط
      cart.cartTerms.forEach((cartTerm) => {
        const term = cartTerm.term;

        // بررسی اینکه ترم در دوره خریداری‌شده نباشد
        const isPurchased = term.courseTerms.some((ct) =>
          purchasedCourseIds.has(ct.course.id),
        );

        if (
          termSet.has(term.id) &&
          !isPurchased && // حذف ترم‌های خریداری‌شده
          term.courseTerms.some((ct) => ct.course.id === course.id)
        ) {
          const termPrice = term.price;
          const discount = term.discount || 0;
          const discountAmount = (termPrice * discount) / 100;
          const finalTermPrice = termPrice - discountAmount;

          const courseInfo = coursesMap.get(course.id);
          courseInfo.finalPrice += finalTermPrice;
          courseInfo.discount += discountAmount;
          courseInfo.finalPriceWithoutDiscount += termPrice;

          // ترم را از لیست مجاز حذف کنید تا دوباره محاسبه نشود
          termSet.delete(term.id);
        }
      });
    });

    const coursesInfo = Array.from(coursesMap.values());

    // محاسبه مجموع قیمت‌ها و تخفیف‌ها
    const totalPrice = coursesInfo.reduce(
      (sum, course) => sum + course.finalPrice,
      0,
    );
    const totalDiscount = coursesInfo.reduce(
      (sum, course) => sum + course.discount,
      0,
    );
    const totalPriceWithoutDiscount = coursesInfo.reduce(
      (sum, course) => sum + course.finalPriceWithoutDiscount,
      0,
    );

    // بازگشت داده‌ها
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
      { message: 'Internal server error.' },
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

    const existingUserCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: parseInt(courseId),
      },
    });

    if (existingUserCourse) {
      return NextResponse.json(
        { message: 'شما قبلاً این دوره را تهیه کرده‌اید.' },
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

    // بررسی وجود دوره در سبد خرید
    const existingCartCourses = await prismadb.cartCourse.findMany({
      where: {
        cartId: cart.id,
        courseId: parseInt(courseId),
      },
    });

    if (existingCartCourses.length > 0) {
      return NextResponse.json(
        { message: 'این دوره قبلاً به سبد خرید شما اضافه شده است.' },
        { status: 400 },
      );
    }

    // پیدا کردن ترم‌های دوره
    const courseTerms = await prismadb.courseTerm.findMany({
      where: { courseId: parseInt(courseId) },
      include: { term: true },
    });

    if (!courseTerms.length) {
      return NextResponse.json(
        { message: 'Course terms not found' },
        { status: 400 },
      );
    }

    // افزودن دوره به CartCourse
    const newCartCourse = {
      cartId: cart.id,
      courseId: parseInt(courseId), // دوره به سبد خرید اضافه می‌شود
    };

    await prismadb.cartCourse.create({
      data: newCartCourse,
    });

    // افزودن ترم‌های جدید به سبد خرید
    const newCartTerms = [];

    for (const ct of courseTerms) {
      // بررسی وجود ترم در سبد خرید
      const existingCartTerm = await prismadb.cartTerm.findFirst({
        where: {
          cartId: cart.id,
          termId: ct.termId,
        },
      });

      // بررسی وجود ترم در ترم‌های خریداری‌شده
      const purchasedTerm = await prismadb.userCourse.findFirst({
        where: {
          userId,
          courseId: ct.courseId,
        },
        include: {
          course: {
            include: {
              courseTerms: {
                where: {
                  termId: ct.termId,
                },
              },
            },
          },
        },
      });

      if (!existingCartTerm && !purchasedTerm) {
        newCartTerms.push({
          cartId: cart.id,
          termId: ct.termId,
          price: ct.term.price,
          discount: ct.term.discount,
        });
      }
    }

    if (newCartTerms.length > 0) {
      await prismadb.cartTerm.createMany({
        data: newCartTerms,
      });
    }

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
        cartCourses: true,
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

    // حذف دوره‌های مرتبط با `courseId` از `cartCourses`
    const deleteCartCoursePromises = cart.cartCourses
      .filter((cartCourse) => cartCourse.courseId === courseId)
      .map((cartCourse) =>
        prismadb.cartCourse.delete({
          where: { id: cartCourse.id },
        }),
      );
    await Promise.all(deleteCartCoursePromises);

    // بررسی ترم‌ها و حذف فقط ترم‌هایی که مرتبط با دوره دیگری نیستند
    const cartTermsToDelete = cart.cartTerms.filter((cartTerm) => {
      const isSharedTerm = cartTerm.term.courseTerms.some(
        (courseTerm) =>
          courseTerm.courseId !== courseId &&
          cart.cartCourses.some(
            (cartCourse) => cartCourse.courseId === courseTerm.courseId,
          ),
      );
      return !isSharedTerm; // حذف فقط ترم‌هایی که مشترک نیستند
    });

    const deleteCartTermPromises = cartTermsToDelete.map((cartTerm) =>
      prismadb.cartTerm.delete({
        where: { id: cartTerm.id },
      }),
    );
    await Promise.all(deleteCartTermPromises);

    // محاسبه قیمت و تخفیف جدید برای سبد خرید
    const remainingCartTerms = await prismadb.cartTerm.findMany({
      where: { cartId: cart.id },
    });

    const updatedTotalPrice = remainingCartTerms.reduce(
      (total, term) => total + term.price,
      0,
    );

    const updatedTotalDiscount = remainingCartTerms.reduce((total, term) => {
      const termDiscountAmount = (term.price * (term.discount || 0)) / 100;
      return total + termDiscountAmount;
    }, 0);

    // به‌روزرسانی فیلدهای totalPrice و totalDiscount
    await prismadb.cart.update({
      where: { id: cart.id },
      data: {
        totalPrice: updatedTotalPrice,
        totalDiscount: updatedTotalDiscount,
      },
    });

    // بررسی و حذف سبد خرید در صورت خالی بودن
    const remainingCartCourses = await prismadb.cartCourse.findMany({
      where: { cartId: cart.id },
    });

    if (remainingCartCourses.length === 0 && remainingCartTerms.length === 0) {
      await prismadb.cart.delete({
        where: { id: cart.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Course and its terms removed from the cart successfully.',
    });
  } catch (error) {
    console.error('Error removing course from cart:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 },
    );
  }
}
