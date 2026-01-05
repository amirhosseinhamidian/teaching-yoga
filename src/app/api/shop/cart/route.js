/* eslint-disable no-undef */
// /app/api/shop/cart/route.js

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

function emptyCart() {
  return {
    cart: {
      id: null,
      items: [],
      subtotal: 0,
      totalWithoutDiscount: 0,
      discountAmount: 0,
      payable: 0,
      totalQty: 0,
      discount: null,
    },
  };
}

export async function GET() {
  try {
    const user = getAuthUser();

    // کاربر لاگین نیست → سبد خالی
    if (!user?.id) {
      return NextResponse.json(emptyCart(), { status: 200 });
    }

    const cart = await prismadb.shopCart.findFirst({
      where: { userId: user.id, status: 'PENDING', isActive: true },
      include: {
        items: {
          orderBy: { id: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                stock: true,
                price: true,
                compareAt: true,
                isActive: true,
              },
            },
            color: { select: { id: true, name: true, hex: true } },
            size: { select: { id: true, name: true, slug: true } },
          },
        },
        discountCode: {
          select: {
            id: true,
            code: true,
            title: true,
            discountPercent: true,
            maxDiscountAmount: true,
            appliesTo: true,
            productCategoryId: true,
            courseId: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(emptyCart(), { status: 200 });
    }

    const items = (cart.items || [])
      .filter((it) => it.product && it.product.isActive) // اختیاری
      .map((it) => ({
        id: it.id,
        cartId: it.cartId,
        productId: it.productId,
        qty: it.qty,
        unitPrice: it.unitPrice,

        // snapshot از محصول
        productTitle: it.product.title,
        productSlug: it.product.slug,
        coverImage: it.product.coverImage,
        stock: it.product.stock,

        // برای totalWithoutDiscount
        compareAt: it.product.compareAt,

        colorId: it.colorId,
        sizeId: it.sizeId,
        color: it.color || null,
        size: it.size || null,
      }));

    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.qty || 0),
      0
    );

    const totalWithoutDiscount = items.reduce((sum, it) => {
      const qty = Number(it.qty || 0);
      const compareAt =
        it.compareAt != null && Number(it.compareAt) > 0
          ? Number(it.compareAt)
          : Number(it.unitPrice || 0);
      return sum + compareAt * qty;
    }, 0);

    const totalQty = items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

    const discountAmount = Number(cart.discountCodeAmount || 0);
    const payable = Math.max(0, subtotal - discountAmount);

    return NextResponse.json(
      {
        cart: {
          id: cart.id,
          items,
          subtotal,
          totalWithoutDiscount,
          discountAmount,
          payable,
          totalQty,
          discount: cart.discountCode
            ? { ...cart.discountCode, appliedAt: cart.discountAppliedAt }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET SHOP CART ERROR:', error);
    return NextResponse.json({ message: 'خطای داخلی سرور.' }, { status: 500 });
  }
}
