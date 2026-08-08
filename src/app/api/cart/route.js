/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { buildCartResponse } from '@/utils/buildCartResponse';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getAuthUser();

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

    const cartResponse = await buildCartResponse(user.id);

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
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const { courseId } = await req.json();
    const courseIdNum = Number(courseId);
    const userId = user.id;

    if (!courseId || Number.isNaN(courseIdNum)) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const bought = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: courseIdNum,
      },
    });

    if (bought) {
      return NextResponse.json(
        { message: 'شما قبلاً این دوره را تهیه کرده‌اید.' },
        { status: 400 }
      );
    }

    let cart = await prismadb.cart.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (!cart) {
      cart = await prismadb.cart.create({
        data: {
          userId,
          status: 'PENDING',
        },
      });
    }

    const existing = await prismadb.cartCourse.findFirst({
      where: {
        cartId: cart.id,
        courseId: courseIdNum,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'این دوره قبلاً به سبد خرید اضافه شده است.' },
        { status: 400 }
      );
    }

    await prismadb.cartCourse.create({
      data: {
        cartId: cart.id,
        courseId: courseIdNum,
      },
    });

    const courseTerms = await prismadb.courseTerm.findMany({
      where: {
        courseId: courseIdNum,
      },
      include: {
        term: true,
      },
    });

    for (const ct of courseTerms) {
      const exists = await prismadb.cartTerm.findFirst({
        where: {
          cartId: cart.id,
          termId: ct.termId,
        },
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
    const user = await getAuthUser();

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
      where: {
        userId,
        status: 'PENDING',
      },
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
      await tx.cartCourse.deleteMany({
        where: {
          cartId: cart.id,
          courseId: courseIdNum,
        },
      });

      const removedCourseTerms = await tx.courseTerm.findMany({
        where: {
          courseId: courseIdNum,
        },
        select: {
          termId: true,
        },
      });

      const removedTermIds = removedCourseTerms.map((item) => item.termId);

      const remainingCartCourses = await tx.cartCourse.findMany({
        where: {
          cartId: cart.id,
        },
        select: {
          courseId: true,
        },
      });

      const remainingCourseIds = remainingCartCourses.map(
        (item) => item.courseId
      );

      if (remainingCourseIds.length === 0) {
        await tx.cartTerm.deleteMany({
          where: {
            cartId: cart.id,
          },
        });
      } else if (removedTermIds.length > 0) {
        const remainingCourseTerms = await tx.courseTerm.findMany({
          where: {
            courseId: {
              in: remainingCourseIds,
            },
          },
          select: {
            termId: true,
          },
        });

        const stillNeededTermIds = new Set(
          remainingCourseTerms.map((item) => item.termId)
        );

        const deletableTermIds = removedTermIds.filter(
          (termId) => !stillNeededTermIds.has(termId)
        );

        if (deletableTermIds.length > 0) {
          await tx.cartTerm.deleteMany({
            where: {
              cartId: cart.id,
              termId: {
                in: deletableTermIds,
              },
            },
          });
        }
      }

      const remainCourses = await tx.cartCourse.count({
        where: {
          cartId: cart.id,
        },
      });

      const remainTerms = await tx.cartTerm.count({
        where: {
          cartId: cart.id,
        },
      });

      const empty = remainCourses === 0 && remainTerms === 0;

      if (empty) {
        const removedId = cart.discountCodeId ?? null;

        await tx.cart.update({
          where: {
            id: cart.id,
          },
          data: {
            status: 'CANCELLED',
            discountCodeId: null,
            discountCodeAmount: 0,
            discountAppliedAt: null,
          },
        });

        if (removedId) {
          const stillUsedInShop = await tx.shopCart.findFirst({
            where: {
              userId,
              status: 'PENDING',
              isActive: true,
              discountCodeId: removedId,
              items: {
                some: {},
              },
            },
            select: {
              id: true,
            },
          });

          const stillUsedInCourse = await tx.cart.findFirst({
            where: {
              userId,
              status: 'PENDING',
              discountCodeId: removedId,
            },
            select: {
              id: true,
            },
          });

          if (!stillUsedInShop && !stillUsedInCourse) {
            await tx.userDiscount.deleteMany({
              where: {
                userId,
                discountCodeId: removedId,
              },
            });

            await tx.discountCode.update({
              where: {
                id: removedId,
              },
              data: {
                usageCount: {
                  decrement: 1,
                },
              },
            });
          }
        }

        return {
          becameEmpty: true,
        };
      }

      return {
        becameEmpty: false,
      };
    });

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

    const response = await buildCartResponse(userId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE CART ERROR:', error);

    return NextResponse.json({ message: 'Internal error.' }, { status: 500 });
  }
}
