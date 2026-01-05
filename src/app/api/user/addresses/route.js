/* eslint-disable no-undef */
// src/app/api/user/addresses/route.js

import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function isValidPhone(phone) {
  return /^09\d{9}$/.test(String(phone || '').trim());
}

function normalizeStr(v) {
  return String(v ?? '').trim();
}

function normalizePostalCode(v) {
  const s = normalizeStr(v);
  if (!s) return null;
  return s;
}

function validateAddressPayload(body, { partial = false } = {}) {
  const errors = {};

  const fullName = normalizeStr(body?.fullName);
  const phone = normalizeStr(body?.phone);
  const province = normalizeStr(body?.province);
  const city = normalizeStr(body?.city);
  const address1 = normalizeStr(body?.address1);
  const postalCode = normalizePostalCode(body?.postalCode);
  const notes = normalizeStr(body?.notes);
  const isDefault = body?.isDefault;

  if (!partial || body?.fullName !== undefined) {
    if (!fullName) errors.fullName = 'نام و نام خانوادگی گیرنده الزامی است.';
  }

  if (!partial || body?.phone !== undefined) {
    if (!isValidPhone(phone)) errors.phone = 'شماره موبایل گیرنده معتبر نیست.';
  }

  if (!partial || body?.province !== undefined) {
    if (!province) errors.province = 'استان الزامی است.';
  }

  if (!partial || body?.city !== undefined) {
    if (!city) errors.city = 'شهر الزامی است.';
  }

  if (!partial || body?.address1 !== undefined) {
    if (!address1) errors.address1 = 'آدرس الزامی است.';
  }

  if (!partial || body?.postalCode !== undefined) {
    if (postalCode && !/^\d{10}$/.test(postalCode)) {
      errors.postalCode = 'کدپستی باید ۱۰ رقم باشد.';
    }
  }

  if (!partial || body?.isDefault !== undefined) {
    if (isDefault != null && typeof isDefault !== 'boolean') {
      errors.isDefault = 'isDefault باید boolean باشد.';
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      fullName: fullName || null,
      phone: phone || null,
      province: province || null,
      city: city || null,
      address1: address1 || null,
      postalCode,
      notes: notes ? notes : null,
      isDefault: typeof isDefault === 'boolean' ? isDefault : false,
    },
  };
}

/**
 * GET /api/user/addresses
 * خروجی: { items: [...] }
 * ترتیب: جدیدترین اول (برای نمایش از آخر به اول در UI)
 */
export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });
    }

    const items = await prismadb.userAddress.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }], // پیش‌فرض بالا، بعد جدیدترین
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('[USER_ADDRESSES_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

/**
 * POST /api/user/addresses
 * body: { fullName, phone, province, city, address1, postalCode?, notes?, isDefault? }
 */
export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const v = validateAddressPayload(body, { partial: false });

    if (!v.ok) {
      return NextResponse.json(
        { error: 'اطلاعات آدرس معتبر نیست.', fields: v.errors },
        { status: 400 }
      );
    }

    const created = await prismadb.$transaction(async (tx) => {
      // اگر آدرس جدید isDefault باشد، قبلی‌ها را false کن
      if (v.values.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false },
        });
      } else {
        // اگر کاربر هیچ آدرس پیش‌فرضی ندارد، اولین آدرس را پیش‌فرض کن
        const hasDefault = await tx.userAddress.findFirst({
          where: { userId: user.id, isDefault: true },
          select: { id: true },
        });
        if (!hasDefault) v.values.isDefault = true;
      }

      return tx.userAddress.create({
        data: {
          userId: user.id,
          fullName: v.values.fullName,
          phone: v.values.phone,
          province: v.values.province,
          city: v.values.city,
          address1: v.values.address1,
          postalCode: v.values.postalCode,
          notes: v.values.notes,
          isDefault: v.values.isDefault,
        },
      });
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[USER_ADDRESSES_POST]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
