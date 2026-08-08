import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

export async function buildShopCartResponse(userId) {
  const cart = await prismadb.shopCart.findFirst({
    where: {
      userId,
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
              isActive: true,
            },
          },
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

  const items = cart.items
    .filter((item) => item.product && item.product.isActive)
    .map((item) => ({
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
      productTitle: item.product.title,
      productSlug: item.product.slug,
      coverImage: toAbsoluteMediaUrl(item.product.coverImage),
      stock: item.product.stock,
      colorId: item.colorId,
      sizeId: item.sizeId,
    }));

  const colorIds = [
    ...new Set(items.map((item) => item.colorId).filter(Boolean)),
  ];

  const sizeIds = [
    ...new Set(items.map((item) => item.sizeId).filter(Boolean)),
  ];

  const [colors, sizes] = await Promise.all([
    colorIds.length
      ? prismadb.color.findMany({
          where: {
            id: {
              in: colorIds,
            },
          },
        })
      : Promise.resolve([]),

    sizeIds.length
      ? prismadb.size.findMany({
          where: {
            id: {
              in: sizeIds,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const colorMap = new Map(colors.map((color) => [color.id, color]));
  const sizeMap = new Map(sizes.map((size) => [size.id, size]));

  const finalItems = items.map((item) => ({
    ...item,
    color: item.colorId ? colorMap.get(item.colorId) || null : null,
    size: item.sizeId ? sizeMap.get(item.sizeId) || null : null,
  }));

  const subtotal = finalItems.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 0),
    0
  );

  const totalQty = finalItems.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  return {
    cart: {
      id: cart.id,
      items: finalItems,
      subtotal,
      totalQty,
    },
  };
}
