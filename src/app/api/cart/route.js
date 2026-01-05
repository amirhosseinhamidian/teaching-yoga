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
    if (!user) {
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { courseId } = await req.json();
    const courseIdNum = Number(courseId);

    if (!courseId || Number.isNaN(courseIdNum)) {
      return NextResponse.json(
        { message: 'Course ID is required.' },
        { status: 400 }
      );
    }

    const cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
      select: {
        id: true,
        discountCodeId: true,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: 'No pending cart found.' },
        { status: 404 }
      );
    }

    const { becameEmpty } = await prismadb.$transaction(async (tx) => {
      // 1) حذف دوره از cartCourses
      await tx.cartCourse.deleteMany({
        where: { cartId: cart.id, courseId: courseIdNum },
      });

      // 2) ترم‌های مربوط به همین course
      const removedCourseTerms = await tx.courseTerm.findMany({
        where: { courseId: courseIdNum },
        select: { termId: true },
      });

      const removedTermIds = removedCourseTerms.map((x) => x.termId);

      // 3) لیست دوره‌های باقی‌مانده داخل cart
      const remainingCartCourses = await tx.cartCourse.findMany({
        where: { cartId: cart.id },
        select: { courseId: true },
      });

      const remainingCourseIds = remainingCartCourses.map((x) => x.courseId);

      // اگر هیچ دوره‌ای باقی نمانده → همه termهای cart حذف می‌شن
      if (remainingCourseIds.length === 0) {
        await tx.cartTerm.deleteMany({ where: { cartId: cart.id } });
      } else if (removedTermIds.length > 0) {
        // 4) termهایی که توسط دوره‌های باقی‌مانده در cart استفاده می‌شوند
        const remainingCourseTerms = await tx.courseTerm.findMany({
          where: { courseId: { in: remainingCourseIds } },
          select: { termId: true },
        });

        const stillNeededTermIds = new Set(
          remainingCourseTerms.map((x) => x.termId)
        );

        // 5) termهایی را حذف کن که مربوط به course حذف‌شده بوده و دیگر لازم نیست
        const deletableTermIds = removedTermIds.filter(
          (tid) => !stillNeededTermIds.has(tid)
        );

        if (deletableTermIds.length > 0) {
          await tx.cartTerm.deleteMany({
            where: { cartId: cart.id, termId: { in: deletableTermIds } },
          });
        }
      }

      // 6) چک خالی شدن cart
      const remainCourses = await tx.cartCourse.count({
        where: { cartId: cart.id },
      });
      const remainTerms = await tx.cartTerm.count({
        where: { cartId: cart.id },
      });

      const empty = remainCourses === 0 && remainTerms === 0;

      // اگر خالی شد → CANCELED + پاک کردن تخفیف
      if (empty) {
        const removedId = cart.discountCodeId ?? null;

        await tx.cart.update({
          where: { id: cart.id },
          data: {
            status: 'CANCELLED',
            // اگر در مدل cart فیلد isActive ندارید حذفش کنید
            // isActive: false,
            discountCodeId: null,
            discountCodeAmount: 0,
            discountAppliedAt: null,
          },
        });

        // اگر تخفیف داشت: userDiscount حذف شود (فقط اگر جای دیگری هنوز از همین کد استفاده نشده)
        if (removedId) {
          const stillUsedInShop = await tx.shopCart.findFirst({
            where: {
              userId,
              status: 'PENDING',
              isActive: true,
              discountCodeId: removedId,
              items: { some: {} },
            },
            select: { id: true },
          });

          const stillUsedInCourse = await tx.cart.findFirst({
            where: {
              userId,
              status: 'PENDING',
              discountCodeId: removedId,
            },
            select: { id: true },
          });

          if (!stillUsedInShop && !stillUsedInCourse) {
            await tx.userDiscount.deleteMany({
              where: { userId, discountCodeId: removedId },
            });

            // اختیاری ولی بهتر: usageCount هم برگرده عقب
            await tx.discountCode.update({
              where: { id: removedId },
              data: { usageCount: { decrement: 1 } },
            });
          }
        }

        return {
          cartId: cart.id,
          becameEmpty: true,
          removedDiscountCodeId: removedId,
        };
      }

      return {
        cartId: cart.id,
        becameEmpty: false,
        removedDiscountCodeId: null,
      };
    });

    // اگر خالی شد → خروجی سبد خالی
    if (becameEmpty) {
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

    // خروجی نهایی
    const response = await buildCartResponse(userId);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE CART ERROR:', error);
    return NextResponse.json({ message: 'Internal error.' }, { status: 500 });
  }
}
