/* eslint-disable no-undef */
// /app/api/shop/cart/items/[itemId]/route.js

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';
import { buildShopCartResponse } from '@/utils/buildShopCartResponse';

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const itemId = Number(params?.itemId);
    if (!itemId || Number.isNaN(itemId)) {
      return NextResponse.json(
        { message: 'آیتم نامعتبر است.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const qty = Number(body?.qty);

    if (!Number.isFinite(qty)) {
      return NextResponse.json(
        { message: 'qty نامعتبر است.' },
        { status: 400 }
      );
    }

    const cartItem = await prismadb.shopCartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: true },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      return NextResponse.json({ message: 'آیتم یافت نشد.' }, { status: 404 });
    }

    // qty <= 0 → حذف
    if (qty <= 0) {
      await prismadb.shopCartItem.delete({ where: { id: itemId } });

      // اگر سبد خالی شد، غیرفعال/ABANDONED + پاک‌کردن تخفیف
      const remainingCount = await prismadb.shopCartItem.count({
        where: { cartId: cartItem.cartId },
      });

      if (remainingCount === 0) {
        await prismadb.shopCart.update({
          where: { id: cartItem.cartId },
          data: {
            status: 'ABANDONED',
            isActive: false,
            discountCodeId: null,
            discountCodeAmount: 0,
            discountAppliedAt: null,
          },
        });
      }

      const response = await buildShopCartResponse(user.id);
      return NextResponse.json(response, { status: 200 });
    }

    // چک موجودی
    if ((cartItem.product.stock ?? 0) < qty) {
      return NextResponse.json(
        { message: `موجودی کافی نیست. موجودی فعلی: ${cartItem.product.stock}` },
        { status: 400 }
      );
    }

    await prismadb.shopCartItem.update({
      where: { id: itemId },
      data: { qty, unitPrice: cartItem.product.price }, // sync price
    });

    const response = await buildShopCartResponse(user.id);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('UPDATE SHOP CART ITEM ERROR:', error);
    return NextResponse.json({ message: 'خطای داخلی سرور.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const itemId = Number(params?.itemId);
    if (!itemId || Number.isNaN(itemId)) {
      return NextResponse.json(
        { message: 'آیتم نامعتبر است.' },
        { status: 400 }
      );
    }

    const item = await prismadb.shopCartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { id: true, userId: true, discountCodeId: true } },
      },
    });

    if (!item || item.cart.userId !== user.id) {
      return NextResponse.json({ message: 'آیتم یافت نشد.' }, { status: 404 });
    }

    const cartId = item.cartId;
    const cartDiscountCodeId = item.cart.discountCodeId ?? null;

    await prismadb.$transaction(async (tx) => {
      // 1) حذف آیتم
      await tx.shopCartItem.delete({ where: { id: itemId } });

      // 2) آیا سبد خالی شد؟
      const remainingCount = await tx.shopCartItem.count({ where: { cartId } });

      if (remainingCount === 0) {
        // 3) ABANDONED + پاک کردن تخفیف
        await tx.shopCart.update({
          where: { id: cartId },
          data: {
            status: 'ABANDONED',
            isActive: false,
            discountCodeId: null,
            discountCodeAmount: 0,
            discountAppliedAt: null,
          },
        });

        // 4) اگر تخفیف داشت: userDiscount حذف شود (اگر جای دیگری استفاده نمی‌شود)
        if (cartDiscountCodeId) {
          const stillUsedInCourse = await tx.cart.findFirst({
            where: {
              userId: user.id,
              status: 'PENDING',
              discountCodeId: cartDiscountCodeId,
            },
            select: { id: true },
          });

          const stillUsedInShop = await tx.shopCart.findFirst({
            where: {
              userId: user.id,
              status: 'PENDING',
              isActive: true,
              discountCodeId: cartDiscountCodeId,
              items: { some: {} },
            },
            select: { id: true },
          });

          if (!stillUsedInCourse && !stillUsedInShop) {
            await tx.userDiscount.deleteMany({
              where: { userId: user.id, discountCodeId: cartDiscountCodeId },
            });

            // اختیاری: برگشت usageCount
            await tx.discountCode.update({
              where: { id: cartDiscountCodeId },
              data: { usageCount: { decrement: 1 } },
            });
          }
        }
      }
    });

    const response = await buildShopCartResponse(user.id);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('DELETE SHOP CART ITEM ERROR:', error);
    return NextResponse.json({ message: 'خطای داخلی سرور.' }, { status: 500 });
  }
}
