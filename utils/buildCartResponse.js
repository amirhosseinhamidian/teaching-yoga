import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

export async function buildCartResponse(userId) {
  const cart = await prismadb.cart.findFirst({
    where: {
      userId,
      status: 'PENDING',
    },
    include: {
      cartTerms: {
        include: {
          term: {
            include: {
              courseTerms: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
      cartCourses: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!cart) {
    return {
      cart: {
        id: null,
        courses: [],
        totalPrice: 0,
        totalDiscount: 0,
        totalPriceWithoutDiscount: 0,
        discountAmount: 0,
      },
    };
  }

  const coursesMap = new Map();

  const purchased = await prismadb.userCourse.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    select: {
      courseId: true,
    },
  });

  const purchasedIds = new Set(purchased.map((course) => course.courseId));

  const termSet = new Set(cart.cartTerms.map((cartTerm) => cartTerm.term.id));

  cart.cartCourses.forEach((cartCourse) => {
    const course = cartCourse.course;

    if (!coursesMap.has(course.id)) {
      coursesMap.set(course.id, {
        courseId: course.id,
        courseTitle: course.title,
        courseCoverImage: toAbsoluteMediaUrl(course.cover),
        finalPrice: 0,
        discount: 0,
        finalPriceWithoutDiscount: 0,
      });
    }

    cart.cartTerms.forEach((cartTerm) => {
      const term = cartTerm.term;

      const isPurchased = term.courseTerms.some((courseTerm) =>
        purchasedIds.has(courseTerm.course.id)
      );

      if (
        termSet.has(term.id) &&
        !isPurchased &&
        term.courseTerms.some(
          (courseTerm) => courseTerm.course.id === course.id
        )
      ) {
        const price = term.price;
        const discount = (price * (term.discount || 0)) / 100;
        const finalPrice = price - discount;

        const courseInfo = coursesMap.get(course.id);

        courseInfo.finalPrice += finalPrice;
        courseInfo.discount += discount;
        courseInfo.finalPriceWithoutDiscount += price;

        termSet.delete(term.id);
      }
    });
  });

  const coursesInfo = Array.from(coursesMap.values());

  const totalPrice = coursesInfo.reduce(
    (sum, course) => sum + course.finalPrice,
    0
  );

  const totalDiscount = coursesInfo.reduce(
    (sum, course) => sum + course.discount,
    0
  );

  const totalPriceWithoutDiscount = coursesInfo.reduce(
    (sum, course) => sum + course.finalPriceWithoutDiscount,
    0
  );

  const discountAmount = cart.discountCodeAmount || 0;

  return {
    cart: {
      id: cart.id,
      courses: coursesInfo,
      totalPrice: totalPrice - discountAmount,
      totalDiscount: totalDiscount + discountAmount,
      totalPriceWithoutDiscount,
      discountAmount,
    },
  };
}
