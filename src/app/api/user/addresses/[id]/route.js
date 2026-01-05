/* eslint-disable no-undef */
// src/app/api/user/addresses/[id]/route.js

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

function validatePatchPayload(body) {
  const errors = {};
  const data = {};

  if (body?.fullName !== undefined) {
    const v = normalizeStr(body.fullName);
    if (!v) errors.fullName = 'نام و نام خانوادگی گیرنده الزامی است.';
    else data.fullName = v;
  }

  if (body?.phone !== undefined) {
    const v = normalizeStr(body.phone);
    if (!isValidPhone(v)) errors.phone = 'شماره موبایل گیرنده معتبر نیست.';
    else data.phone = v;
  }

  if (body?.province !== undefined) {
    const v = normalizeStr(body.province);
    if (!v) errors.province = 'استان الزامی است.';
    else data.province = v;
  }

  if (body?.city !== undefined) {
    const v = normalizeStr(body.city);
    if (!v) errors.city = 'شهر الزامی است.';
    else data.city = v;
  }

  if (body?.address1 !== undefined) {
    const v = normalizeStr(body.address1);
    if (!v) errors.address1 = 'آدرس الزامی است.';
    else data.address1 = v;
  }

  if (body?.postalCode !== undefined) {
    const v = normalizePostalCode(body.postalCode);
    if (v && !/^\d{10}$/.test(v))
      errors.postalCode = 'کدپستی باید ۱۰ رقم باشد.';
    else data.postalCode = v;
  }

  if (body?.notes !== undefined) {
    const v = normalizeStr(body.notes);
    data.notes = v ? v : null;
  }

  if (body?.isDefault !== undefined) {
    if (typeof body.isDefault !== 'boolean') {
      errors.isDefault = 'isDefault باید boolean باشد.';
    } else {
      data.isDefault = body.isDefault;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data,
  };
}

/**
 * PATCH /api/user/addresses/:id
 */
export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد شوید.' }, { status: 401 });
    }

    const id = Number(params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه آدرس نامعتبر است.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const v = validatePatchPayload(body);

    if (!v.ok) {
      return NextResponse.json(
        { error: 'اطلاعات آدرس معتبر نیست.', fields: v.errors },
        { status: 400 }
      );
    }

    if (Object.keys(v.data).length === 0) {
      return NextResponse.json(
        { error: 'هیچ داده‌ای برای بروزرسانی ارسال نشده است.' },
        { status: 400 }
      );
    }

    // اطمینان از مالکیت آدرس
    const existing = await prismadb.userAddress.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'آدرس یافت نشد.' }, { status: 404 });
    }

    const updated = await prismadb.$transaction(async (tx) => {
      // اگر این آدرس قرار است default شود => بقیه false
      if (v.data.isDefault === true) {
        await tx.userAddress.updateMany({
          where: { userId: user.id, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      const u = await tx.userAddress.update({
        where: { id },
        data: v.data,
      });

      // اگر کاربر همه defaultها را برداشت (isDefault=false) => یکی را default کن
      if (v.data.isDefault === false) {
        const hasDefault = await tx.userAddress.findFirst({
          where: { userId: user.id, isDefault: true },
          select: { id: true },
        });

        if (!hasDefault) {
          // همان آدرس یا جدیدترین آدرس را default کن
          await tx.userAddress.update({
            where: { id: u.id },
            data: { isDefault: true },
          });

          return tx.userAddress.findUnique({ where: { id: u.id } });
        }
      }

      return u;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[USER_ADDRESSES_PATCH]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'ابتدا وارد حساب کاربری شوید.' },
        { status: 401 }
      );
    }

    const id = Number(params?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'شناسه آدرس نامعتبر است.' },
        { status: 400 }
      );
    }

    // بررسی اینکه آدرس متعلق به کاربر است
    const address = await prismadb.userAddress.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'آدرس مورد نظر یافت نشد.' },
        { status: 404 }
      );
    }

    const wasDefault = address.isDefault;

    await prismadb.$transaction(async (tx) => {
      // حذف آدرس
      await tx.userAddress.delete({
        where: { id },
      });

      // اگر آدرس حذف‌شده پیش‌فرض بود
      if (wasDefault) {
        const next = await tx.userAddress.findFirst({
          where: { userId: user.id },
          orderBy: { id: 'desc' },
        });

        if (next) {
          await tx.userAddress.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json(
      { success: true, message: 'آدرس با موفقیت حذف شد.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[USER_ADDRESSES_DELETE]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
