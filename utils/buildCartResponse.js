import prismadb from '@/libs/prismadb';

export async function buildCartResponse(userId) {
  const cart = await prismadb.cart.findFirst({
    where: { userId, status: 'PENDING' },
    include: {
      cartTerms: {
        include: {
          term: {
            include: {
              courseTerms: {
                include: { course: true },
              },
            },
          },
        },
      },
      cartCourses: {
        include: { course: true },
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

  // ===== محاسبات دوره، ترم و قیمت =====
  const coursesMap = new Map();
  const purchased = await prismadb.userCourse.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { courseId: true },
  });
  const purchasedIds = new Set(purchased.map((c) => c.courseId));
  const termSet = new Set(cart.cartTerms.map((ct) => ct.term.id));

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

    cart.cartTerms.forEach((ct) => {
      const term = ct.term;

      const isPurchased = term.courseTerms.some((ct2) =>
        purchasedIds.has(ct2.course.id)
      );

      if (
        termSet.has(term.id) &&
        !isPurchased &&
        term.courseTerms.some((ct2) => ct2.course.id === course.id)
      ) {
        const price = term.price;
        const dis = (price * (term.discount || 0)) / 100;
        const final = price - dis;

        const info = coursesMap.get(course.id);
        info.finalPrice += final;
        info.discount += dis;
        info.finalPriceWithoutDiscount += price;

        termSet.delete(term.id);
      }
    });
  });

  const coursesInfo = Array.from(coursesMap.values());

  const totalPrice = coursesInfo.reduce((s, c) => s + c.finalPrice, 0);
  const totalDiscount = coursesInfo.reduce((s, c) => s + c.discount, 0);
  const totalPriceWithoutDiscount = coursesInfo.reduce(
    (s, c) => s + c.finalPriceWithoutDiscount,
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
