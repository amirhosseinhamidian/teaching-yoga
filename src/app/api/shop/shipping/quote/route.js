// src/app/api/shop/shipping/quote/route.js
/* eslint-disable no-undef */

import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

import { getPostexBoxesCached } from '@/utils/shipping/postex/postexCache';
import { selectPostexBoxId } from '@/utils/shipping/postex/selectPostexBoxId';
import {
  searchPostexCities,
  fetchPostexQuotes,
} from '@/utils/shipping/postex/postexClient';

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizeFa(s) {
  return String(s || '')
    .trim()
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function rialToTomanCeil(rial) {
  const n = toInt(rial, 0);
  return Math.ceil(n / 10);
}

/**
 * ✅ fallback shipping:
 * اگر Postex نتیجه نداد، فقط پست پیشتاز و مبلغ براساس وزن
 * اگر پارامترهای fallback در سایت تنظیم نشده باشند => -1 (یعنی محاسبه نشد)
 */
function computeFallbackShippingToman(totalWeightGram, siteInfo, toProvince) {
  // ✅ اگر هر کدام null بود => بعداً محاسبه می‌شود
  if (
    siteInfo?.postFallbackBaseCost == null ||
    siteInfo?.postFallbackCostPerKg == null
  ) {
    return -1;
  }

  const base = toInt(siteInfo.postFallbackBaseCost); // تومان
  const perKg = toInt(siteInfo.postFallbackCostPerKg); // تومان

  const kg = Math.max(
    1,
    Math.ceil(Math.max(0, toInt(totalWeightGram, 0)) / 1000)
  );
  const raw = base + kg * perKg;

  const province = normalizeFa(toProvince);
  const isTehran = province.includes('تهران'); // ✅ مطمئن‌تر از ===
  const factor = isTehran ? 1 : 1.5;

  return Math.ceil(raw * factor);
}

/**
 * ✅ ساخت پاسخ fallback به صورت یکجا
 * اگر amount = -1 => پیام "بعداً محاسبه می‌شود" + amount همان -1
 */
function buildFallbackResponse({ fallbackCost, reason, note, meta }) {
  const isUnknownCost = Number(fallbackCost) === -1;

  return NextResponse.json(
    {
      success: true,
      source: 'FALLBACK',
      options: [
        {
          key: 'FALLBACK_POST_FAST',
          title: 'پست پیشتاز',
          amount: isUnknownCost ? -1 : fallbackCost, // ✅ همان -1
          logoUrl: '/images/post.jpeg',
          etaText: isUnknownCost ? 'بعداً اعلام می‌شود' : 'از ۴ تا ۷ روز کاری',
          meta: {
            ...meta,
            unknownCost: isUnknownCost,
          },
        },
      ],
      // ✅ پیام مناسب برای UI
      note:
        note ||
        (isUnknownCost
          ? 'در حال حاضر امکان محاسبه هزینه ارسال وجود ندارد. هزینه ارسال پس از بررسی محاسبه و به شما اطلاع داده می‌شود.'
          : 'هزینه ارسال به صورت تقریبی محاسبه شد.'),
      meta: {
        reason,
        ...meta,
        fallbackCost, // برای دیباگ
      },
    },
    { status: 200 }
  );
}

/**
 * پیدا کردن city_id با تطبیق کامل استان و شهر
 */
async function resolvePostexCityId({ city, province }) {
  const cityKey = normalizeFa(city);
  const provinceKey = normalizeFa(province);

  if (!cityKey) return null;

  const results = await searchPostexCities(cityKey);
  if (!results.length) return null;

  const exact = results.find((r) => {
    const c = normalizeFa(r.cityName);
    const p = normalizeFa(r.provinceName);
    return c === cityKey && (!provinceKey || p === provinceKey);
  });

  if (exact?.cityId) return exact.cityId;

  const byFullName = results.find((r) => {
    const f = normalizeFa(r.fullName);
    const wantCity = f.includes(cityKey);
    const wantProv = provinceKey ? f.includes(provinceKey) : true;
    return wantCity && wantProv;
  });

  return byFullName?.cityId || null;
}

/**
 * استخراج گزینه‌های سرویس از پاسخ جدید پستکس
 */
function mapPostexToOptions(quoteRes) {
  const shippingPrices = Array.isArray(quoteRes?.shipping_prices)
    ? quoteRes.shipping_prices
    : [];

  const firstParcel = shippingPrices[0] || null;
  const services = Array.isArray(firstParcel?.service_price)
    ? firstParcel.service_price
    : [];

  if (!services.length) return [];

  const sorted = [...services].sort((a, b) => {
    const pa = toInt(a?.totalPrice ?? a?.initPrice ?? 0);
    const pb = toInt(b?.totalPrice ?? b?.initPrice ?? 0);
    return pa - pb;
  });

  return sorted.map((s) => {
    const courierCode = String(
      s?.courierCodeAlias || s?.courierCode || 'IR_POST'
    );
    const serviceType = String(s?.serviceType || '');
    const serviceName = String(s?.serviceName || 'ارسال پستی');

    const amountToman = rialToTomanCeil(s?.totalPrice ?? s?.initPrice ?? 0);

    const etaText = String(s?.slaDays || '').trim()
      ? String(s.slaDays).trim()
      : s?.slaHours
        ? `حدود ${s.slaHours} ساعت کاری`
        : '—';

    const logoUrl = s?.courierLogo ? String(s.courierLogo) : null;

    return {
      key: `POSTEX_${courierCode}_${serviceType || serviceName}`.replace(
        /\s+/g,
        '_'
      ),
      title: serviceName,
      amount: amountToman, // تومان
      logoUrl,
      etaText,
      meta: {
        courierCode,
        serviceType,
        slaHours: s?.slaHours ?? null,
        vatRial: toInt(s?.vat ?? 0),
        discountAmountRial: toInt(s?.discountAmount ?? 0),
        initPriceRial: toInt(s?.initPrice ?? 0),
        totalPriceRial: toInt(s?.totalPrice ?? 0),
      },
    };
  });
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const { addressId } = await req.json().catch(() => ({}));
    const addressIdNum = Number(addressId);

    if (!addressIdNum || Number.isNaN(addressIdNum)) {
      return NextResponse.json(
        { success: false, message: 'آدرس نامعتبر است.' },
        { status: 400 }
      );
    }

    const [siteInfo, address, cart] = await Promise.all([
      prismadb.siteInfo.findFirst({ orderBy: { id: 'asc' } }),
      prismadb.userAddress.findFirst({
        where: { id: addressIdNum, userId: user.id },
      }),
      prismadb.shopCart.findFirst({
        where: { userId: user.id, status: 'PENDING', isActive: true },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  isActive: true,
                  weightGram: true,
                  packageBoxTypeId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (siteInfo?.postEnabled === false) {
      return NextResponse.json(
        { success: false, message: 'ارسال با پست غیرفعال است.' },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { success: false, message: 'آدرس یافت نشد.' },
        { status: 404 }
      );
    }

    const items = (cart?.items || []).filter((it) => it.product?.isActive);
    if (!cart || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'سبد خرید محصولات خالی است.' },
        { status: 400 }
      );
    }

    // مجموع وزن و مبلغ محصولات
    const totalWeightGram = items.reduce((sum, it) => {
      const w = toInt(it.product?.weightGram ?? 0);
      const qty = Math.max(1, toInt(it.qty ?? 1));
      return sum + w * qty;
    }, 0);

    const totalProductsToman = items.reduce((sum, it) => {
      const qty = Math.max(1, toInt(it.qty ?? 1));
      const unit = toInt(it.unitPrice ?? 0);
      return sum + unit * qty;
    }, 0);

    // box type
    const { boxes } = await getPostexBoxesCached();

    const normalizedBoxes = (boxes || []).map((b) => ({
      id: Number(b.id),
      height: Number(b.height || 0),
      width: Number(b.width || 0),
      length: Number(b.length || 0),
    }));

    const boxTypeId = selectPostexBoxId({
      items: items.map((it) => ({
        packageBoxTypeId: it.product?.packageBoxTypeId ?? null,
        qty: it.qty,
      })),
      boxes: normalizedBoxes,
      defaultBoxTypeId: 13,
    });

    // مقصد
    const toCityCode = await resolvePostexCityId({
      city: address.city,
      province: address.province,
    });

    // اگر cityCode پیدا نشد => fallback (ممکنه -1 بده)
    if (!toCityCode) {
      const fallbackCost = computeFallbackShippingToman(
        totalWeightGram,
        siteInfo,
        address.province
      );

      return buildFallbackResponse({
        fallbackCost,
        reason: 'CITY_NOT_FOUND',
        note:
          fallbackCost === -1
            ? 'در حال حاضر امکان محاسبه هزینه ارسال وجود ندارد . هزینه ارسال پس از بررسی محاسبه و به شما اطلاع داده می‌شود.'
            : 'شهر مقصد در سامانه پستکس یافت نشد؛ هزینه ارسال بر اساس وزن محاسبه شد.',
        meta: {
          totalWeightGram,
          totalProductsToman,
          toCityCode: null,
          boxTypeId,
        },
      });
    }

    // payload Postex
    const payload = {
      collection_type: 'courier_drop_off',
      from_city_code: toInt(siteInfo?.postexFromCityCode ?? 1),
      courier: {
        courier_code: 'IR_POST',
        service_type: '',
      },
      value_added_service: {},
      parcels: [
        {
          custom_parcel_id: '',
          to_city_code: toCityCode,
          payment_type: 'SENDER',
          parcel_properties: {
            total_weight: Math.max(1, toInt(totalWeightGram)), // گرم
            is_fragile: false,
            is_liquid: false,
            total_value: Math.max(0, toInt(totalProductsToman) * 10), // ریال
            pre_paid_amount: null,
            total_value_currency: 'IRR',
            box_type_id: toInt(boxTypeId),
          },
        },
      ],
    };

    // Postex quote
    try {
      const quoteRes = await fetchPostexQuotes(payload);
      const options = mapPostexToOptions(quoteRes);

      // اگر سرویس‌ها برنگشت => fallback (ممکنه -1 بده)
      if (!options.length) {
        const fallbackCost = computeFallbackShippingToman(
          totalWeightGram,
          siteInfo,
          address.province
        );

        return buildFallbackResponse({
          fallbackCost,
          reason: 'NO_SERVICE_RETURNED',
          note:
            fallbackCost === -1
              ? 'در حال حاضر امکان محاسبه هزینه ارسال وجود ندارد . هزینه ارسال پس از بررسی محاسبه و به شما اطلاع داده می‌شود.'
              : 'پستکس سرویس قابل محاسبه برنگرداند؛ هزینه ارسال بر اساس وزن محاسبه شد.',
          meta: {
            totalWeightGram,
            totalProductsToman,
            toCityCode,
            boxTypeId,
            raw: quoteRes,
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          source: 'POSTEX',
          options,
          note: '',
          meta: {
            totalWeightGram,
            totalProductsToman,
            toCityCode,
            boxTypeId,
            raw: quoteRes, // برای دیباگ (اختیاری)
          },
        },
        { status: 200 }
      );
    } catch (e) {
      const fallbackCost = computeFallbackShippingToman(
        totalWeightGram,
        siteInfo,
        address.province
      );

      return buildFallbackResponse({
        fallbackCost,
        reason: 'POSTEX_ERROR',
        note:
          fallbackCost === -1
            ? 'در حال حاضر امکان محاسبه هزینه ارسال وجود ندارد . هزینه ارسال پس از بررسی محاسبه و به شما اطلاع داده می‌شود.'
            : 'خطا در ارتباط با پستکس؛ هزینه ارسال بر اساس وزن محاسبه شد.',
        meta: {
          message: String(e?.message || ''),
          status: e?.status || null,
          totalWeightGram,
          totalProductsToman,
          toCityCode,
          boxTypeId,
        },
      });
    }
  } catch (error) {
    console.error('[SHOP_SHIPPING_QUOTE_POST]', error);
    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور.' },
      { status: 500 }
    );
  }
}
