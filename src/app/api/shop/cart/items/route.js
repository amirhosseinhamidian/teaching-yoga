/* eslint-disable no-undef */
// /app/api/shop/cart/items/route.js

import prismadb from '@/libs/prismadb';
import { buildShopCartResponse } from '@/utils/buildShopCartResponse';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const productId = Number(body?.productId);
    const colorId = body?.colorId != null ? Number(body.colorId) : null;
    const sizeId = body?.sizeId != null ? Number(body.sizeId) : null;
    const qty = body?.qty != null ? Number(body.qty) : 1;

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json(
        { message: 'productId نامعتبر است.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json(
        { message: 'qty نامعتبر است.' },
        { status: 400 }
      );
    }

    // محصول
    const product = await prismadb.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        isActive: true,
        stock: true,
        price: true,
        title: true,
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { message: 'محصول یافت نشد یا غیرفعال است.' },
        { status: 404 }
      );
    }

    // اعتبارسنجی رنگ/سایز برای همین محصول (اگر جدول میانی دارید)
    // اگر اسم جدول‌ها فرق دارد، همین 2 تکه را با نام درست جایگزین کن
    if (colorId != null) {
      const ok = await prismadb.productColor.findUnique({
        where: { productId_colorId: { productId, colorId } },
      });
      if (!ok) {
        return NextResponse.json(
          { message: 'رنگ نامعتبر است.' },
          { status: 400 }
        );
      }
    }

    if (sizeId != null) {
      const ok = await prismadb.productSize.findUnique({
        where: { productId_sizeId: { productId, sizeId } },
      });
      if (!ok) {
        return NextResponse.json(
          { message: 'سایز نامعتبر است.' },
          { status: 400 }
        );
      }
    }

    // پیدا یا ساخت cart فعال
    let cart = await prismadb.shopCart.findFirst({
      where: { userId: user.id, status: 'PENDING', isActive: true },
      select: { id: true },
    });

    if (!cart) {
      cart = await prismadb.shopCart.create({
        data: { userId: user.id, status: 'PENDING', isActive: true },
        select: { id: true },
      });
    }

    // آیتم مشابه؟
    const existing = await prismadb.shopCartItem.findFirst({
      where: { cartId: cart.id, productId, colorId, sizeId },
      select: { id: true, qty: true },
    });

    const existingQty = existing?.qty ?? 0;
    const nextQty = existingQty + qty;

    // چک موجودی
    if ((product.stock ?? 0) < nextQty) {
      return NextResponse.json(
        { message: `موجودی کافی نیست. موجودی فعلی: ${product.stock}` },
        { status: 400 }
      );
    }

    if (existing) {
      await prismadb.shopCartItem.update({
        where: { id: existing.id },
        data: { qty: nextQty, unitPrice: product.price }, // sync price
      });
    } else {
      await prismadb.shopCartItem.create({
        data: {
          cartId: cart.id,
          productId,
          qty,
          unitPrice: product.price,
          colorId,
          sizeId,
        },
      });
    }

    const response = await buildShopCartResponse(user.id);
    return NextResponse.json(
      { success: true, message: 'به سبد خرید اضافه شد.', ...response },
      { status: 200 }
    );
  } catch (error) {
    console.error('ADD SHOP CART ITEM ERROR:', error);
    return NextResponse.json({ message: 'خطای داخلی سرور.' }, { status: 500 });
  }
}
