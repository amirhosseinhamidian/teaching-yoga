import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { courseId, termId } = await request.json();

    if (!courseId || isNaN(parseInt(courseId))) {
      return NextResponse.json(
        { error: 'Invalid course ID.' },
        { status: 400 },
      );
    }

    if (!termId || isNaN(parseInt(termId))) {
      return NextResponse.json({ error: 'Invalid term ID.' }, { status: 400 });
    }

    // پیدا کردن سبدهای خرید مرتبط با دوره خاص
    const cartCourses = await prismadb.cartCourse.findMany({
      where: {
        courseId: parseInt(courseId),
        cart: {
          status: 'PENDING', // فقط سبدهای در وضعیت PENDING
        },
      },
      include: {
        cart: {
          include: {
            cartTerms: true, // دریافت ترم‌های سبد
          },
        },
      },
    });

    // پیدا کردن قیمت و تخفیف ترم
    const term = await prismadb.term.findUnique({
      where: { id: parseInt(termId) },
    });

    if (!term) {
      return NextResponse.json({ error: 'Term not found.' }, { status: 404 });
    }

    const { price, discount } = term;

    // اضافه کردن ترم به سبدهایی که هنوز این ترم را ندارند
    const addedCarts = [];
    const promises = cartCourses.map(async ({ cart }) => {
      const termExists = cart.cartTerms.some(
        (cartTerm) => cartTerm.termId === parseInt(termId),
      );

      if (!termExists) {
        await prismadb.cartTerm.create({
          data: {
            cartId: cart.id,
            termId: parseInt(termId),
            price,
            discount,
          },
        });

        addedCarts.push(cart.id); // ذخیره شناسه سبد خریدی که آپدیت شده
      }
    });

    await Promise.allSettled(promises);

    // بروزرسانی totalPrice و totalDiscount برای سبدهایی که تغییر کرده‌اند
    const updatePromises = addedCarts.map(async (cartId) => {
      const updatedCartTerms = await prismadb.cartTerm.findMany({
        where: { cartId },
      });

      const newTotalPrice = updatedCartTerms.reduce(
        (sum, term) => sum + term.price,
        0,
      );

      const newTotalDiscount = updatedCartTerms.reduce((sum, term) => {
        const discountAmount = (term.price * (term.discount || 0)) / 100;
        return sum + discountAmount;
      }, 0);

      await prismadb.cart.update({
        where: { id: cartId },
        data: {
          totalPrice: newTotalPrice,
          totalDiscount: newTotalDiscount,
        },
      });
    });

    await Promise.allSettled(updatePromises);

    return NextResponse.json(
      { message: 'Term added and cart totals updated where necessary.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error adding term and updating cart totals:', error);
    return NextResponse.json(
      { error: 'An unknown error occurred.' },
      { status: 500 },
    );
  }
}
