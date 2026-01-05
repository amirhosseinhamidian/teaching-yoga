import prismadb from '@/libs/prismadb';

export async function buildShopCartResponse(userId) {
  const cart = await prismadb.shopCart.findFirst({
    where: { userId, status: 'PENDING', isActive: true },
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
              isActive: true,
            },
          },
          // اگر relation مستقیم نزدی، این include ها رو حذف کن
          // و اطلاعات color/size رو جدا fetch کن
        },
      },
    },
  });

  if (!cart) {
    return {
      cart: {
        id: null,
        items: [],
        subtotal: 0,
        totalQty: 0,
      },
    };
  }

  // اگر می‌خوای اطلاعات رنگ/سایز را هم بدهی:
  // چون ShopCartItem الان relation به Color/Size تعریف نکرده (تو schema فقط comment گذاشتی)
  // بهترین حالت: relation را اضافه کنی. ولی اگر فعلاً نمی‌خوای schema را تغییر بدی،
  // می‌تونیم اینجا با دو query جدا color/size ها را map کنیم (پایین).

  const items = cart.items
    .filter((it) => it.product && it.product.isActive)
    .map((it) => ({
      id: it.id,
      productId: it.productId,
      qty: it.qty,
      unitPrice: it.unitPrice,
      productTitle: it.product.title,
      productSlug: it.product.slug,
      coverImage: it.product.coverImage,
      stock: it.product.stock,
      colorId: it.colorId,
      sizeId: it.sizeId,
    }));

  // (اختیاری) enrich color/size
  const colorIds = [...new Set(items.map((i) => i.colorId).filter(Boolean))];
  const sizeIds = [...new Set(items.map((i) => i.sizeId).filter(Boolean))];

  const [colors, sizes] = await Promise.all([
    colorIds.length
      ? prismadb.color.findMany({ where: { id: { in: colorIds } } })
      : Promise.resolve([]),
    sizeIds.length
      ? prismadb.size.findMany({ where: { id: { in: sizeIds } } })
      : Promise.resolve([]),
  ]);

  const colorMap = new Map(colors.map((c) => [c.id, c]));
  const sizeMap = new Map(sizes.map((s) => [s.id, s]));

  const finalItems = items.map((it) => ({
    ...it,
    color: it.colorId ? colorMap.get(it.colorId) || null : null,
    size: it.sizeId ? sizeMap.get(it.sizeId) || null : null,
  }));

  const subtotal = finalItems.reduce(
    (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.qty || 0),
    0
  );
  const totalQty = finalItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);

  return {
    cart: {
      id: cart.id,
      items: finalItems,
      subtotal,
      totalQty,
    },
  };
}
