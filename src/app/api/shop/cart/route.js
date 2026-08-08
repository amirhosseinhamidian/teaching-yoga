/* eslint-disable no-undef */

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

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
    const user = await getAuthUser();

    if (!user?.id) {
      return NextResponse.json(emptyCart(), { status: 200 });
    }

    const cart = await prismadb.shopCart.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            id: 'desc',
          },
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
            color: {
              select: {
                id: true,
                name: true,
                hex: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
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
      .filter((item) => item.product && item.product.isActive)
      .map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,

        productTitle: item.product.title,
        productSlug: item.product.slug,
        coverImage: toAbsoluteMediaUrl(item.product.coverImage),
        stock: item.product.stock,
        compareAt: item.product.compareAt,

        colorId: item.colorId,
        sizeId: item.sizeId,
        color: item.color || null,
        size: item.size || null,
      }));

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 0),
      0
    );

    const totalWithoutDiscount = items.reduce((sum, item) => {
      const qty = Number(item.qty || 0);

      const compareAt =
        item.compareAt != null && Number(item.compareAt) > 0
          ? Number(item.compareAt)
          : Number(item.unitPrice || 0);

      return sum + compareAt * qty;
    }, 0);

    const totalQty = items.reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    );

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
            ? {
                ...cart.discountCode,
                appliedAt: cart.discountAppliedAt,
              }
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
