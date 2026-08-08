import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

function mapUiStatusToDb(statusKey) {
  const key = String(statusKey || '').toLowerCase();

  if (key === 'preparing') {
    return {
      status: {
        in: ['PROCESSING', 'PACKED'],
      },
    };
  }

  if (key === 'shipped') {
    return { status: 'SHIPPED' };
  }

  if (key === 'delivered') {
    return { status: 'DELIVERED' };
  }

  if (key === 'cancelled') {
    return { status: 'CANCELLED' };
  }

  if (key === 'returned') {
    return { status: 'RETURNED' };
  }

  return {
    status: {
      in: ['PROCESSING', 'PACKED'],
    },
  };
}

function resolveOrderItemCover(value) {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  let mediaValue = rawValue;

  /*
   * اگر سفارش قدیمی باشد و URL کامل دامنه قبلی
   * داخل دیتابیس ذخیره شده باشد، فقط مسیر images/... را استخراج می‌کنیم
   * تا خروجی روی MEDIA_PUBLIC_BASE_URL ساخته شود.
   */
  if (/^https?:\/\//i.test(rawValue)) {
    try {
      const parsedUrl = new URL(rawValue);
      const decodedPath = decodeURIComponent(parsedUrl.pathname || '');

      const imagesIndex = decodedPath.indexOf('/images/');

      if (imagesIndex >= 0) {
        mediaValue = decodedPath.slice(imagesIndex + 1); // => images/...
      } else {
        /*
         * اگر URL کامل بود ولی مسیر media قابل استخراج نبود،
         * همان مقدار را به toAbsoluteMediaUrl نمی‌دهیم چون دوباره
         * URL قدیمی را برمی‌گرداند.
         */
        return null;
      }
    } catch (error) {
      console.error('[PROFILE_SHOP_ORDER_COVER_PARSE_ERROR]', {
        value: rawValue,
        error,
      });
      return null;
    }
  }

  mediaValue = mediaValue.replace(/\\/g, '/').replace(/^\/+/, '');

  try {
    return toAbsoluteMediaUrl(mediaValue);
  } catch (error) {
    console.error('[PROFILE_SHOP_ORDER_COVER_RESOLVE_ERROR]', {
      value: rawValue,
      normalized: mediaValue,
      error,
    });
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await getAuthUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || 'preparing';

    const page = Math.max(1, Number(searchParams.get('page') || 1));

    const pageSize = Math.min(
      20,
      Math.max(5, Number(searchParams.get('pageSize') || 10))
    );

    const skip = (page - 1) * pageSize;

    const where = {
      userId: user.id,
      ...mapUiStatusToDb(status),
    };

    const [orders, total] = await Promise.all([
      prismadb.shopOrder.findMany({
        where,
        orderBy: {
          id: 'desc',
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          trackingCode: true,
          shippingTitle: true,
          shippingCost: true,
          postOptionKey: true,
          subtotal: true,
          discountAmount: true,
          payableOnline: true,
          shippingMethod: true,
          createdAt: true,
          updatedAt: true,
          deliveryDate: true,
          items: {
            select: {
              id: true,
              title: true,
              qty: true,
              unitPrice: true,
              coverImage: true,
              slug: true,

              /*
               * تصویر فعلی محصول را هم می‌گیریم
               * تا اگر snapshot قدیمی خراب بود از این استفاده کنیم
               */
              product: {
                select: {
                  coverImage: true,
                  slug: true,
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
                },
              },
              returnRequest: {
                select: {
                  id: true,
                  status: true,
                  reason: true,
                  qty: true,
                  description: true,
                  adminNote: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      }),

      prismadb.shopOrder.count({
        where,
      }),
    ]);

    const normalizedOrders = orders.map((order) => ({
      ...order,
      items: Array.isArray(order.items)
        ? order.items.map((item) => {
            const resolvedCover =
              resolveOrderItemCover(item.product?.coverImage) ||
              resolveOrderItemCover(item.coverImage);

            return {
              ...item,
              coverImage: resolvedCover,
              slug: item.product?.slug || item.slug || null,
              product: undefined,
            };
          })
        : [],
    }));

    const hasMore = skip + orders.length < total;

    return NextResponse.json({
      orders: normalizedOrders,
      page,
      pageSize,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('[PROFILE_SHOP_ORDERS_GET]', error);

    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
