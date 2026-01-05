// /app/api/admin/shop/settings/route.js
/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function isAdminOrManager(user) {
  return !!user?.id && (user.role === 'ADMIN' || user.role === 'MANAGER');
}

async function getSiteInfo() {
  return prismadb.siteInfo.findFirst({ orderBy: { id: 'asc' } });
}

function toIntOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseNonNegativeIntOrNull(v) {
  const n = toIntOrNull(v);
  if (n === null) return null;
  if (n < 0) return null;
  return n;
}

function normalizeShopVisibility(v) {
  const s = String(v || '').toUpperCase();
  if (s === 'OFF') return 'OFF';
  if (s === 'ADMIN_ONLY') return 'ADMIN_ONLY';
  if (s === 'ALL') return 'ALL';
  return null;
}

export async function GET() {
  try {
    const user = getAuthUser();
    if (!isAdminOrManager(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const site = await getSiteInfo();

    return NextResponse.json(
      {
        shopVisibility: site?.shopVisibility ?? 'ALL',
        shopLeadTimeDays: site?.shopLeadTimeDays ?? 1,
        postFallbackBaseCost: site?.postFallbackBaseCost ?? null,
        postFallbackCostPerKg: site?.postFallbackCostPerKg ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_SHOP_SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const user = getAuthUser();
    if (!isAdminOrManager(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // ✅ Partial Update
    const data = {};

    // 1) shopVisibility
    if ('shopVisibility' in body) {
      const v = normalizeShopVisibility(body.shopVisibility);
      if (!v) {
        return NextResponse.json(
          { error: 'shopVisibility must be one of: OFF | ADMIN_ONLY | ALL' },
          { status: 400 }
        );
      }
      data.shopVisibility = v;
    }

    // 2) shopLeadTimeDays
    if ('shopLeadTimeDays' in body) {
      const n = toIntOrNull(body.shopLeadTimeDays);
      if (n === null || n < 0) {
        return NextResponse.json(
          { error: 'shopLeadTimeDays must be an integer >= 0' },
          { status: 400 }
        );
      }
      data.shopLeadTimeDays = n;
    }

    // 3) postFallbackBaseCost (nullable int >=0)
    if ('postFallbackBaseCost' in body) {
      data.postFallbackBaseCost =
        body.postFallbackBaseCost === null
          ? null
          : parseNonNegativeIntOrNull(body.postFallbackBaseCost);
    }

    // 4) postFallbackCostPerKg (nullable int >=0)
    if ('postFallbackCostPerKg' in body) {
      data.postFallbackCostPerKg =
        body.postFallbackCostPerKg === null
          ? null
          : parseNonNegativeIntOrNull(body.postFallbackCostPerKg);
    }

    const site = await getSiteInfo();

    // ✅ اگر SiteInfo وجود نداشت create کنیم (companyEmail required)
    const updated = site
      ? await prismadb.siteInfo.update({
          where: { id: site.id },
          data,
        })
      : await prismadb.siteInfo.create({
          data: {
            shortDescription: '',
            fullDescription: '',
            companyEmail: 'noreply@example.com',

            shopVisibility: data.shopVisibility ?? 'ALL',
            shopLeadTimeDays: data.shopLeadTimeDays ?? 1,
            postFallbackBaseCost:
              data.postFallbackBaseCost === undefined
                ? null
                : data.postFallbackBaseCost,
            postFallbackCostPerKg:
              data.postFallbackCostPerKg === undefined
                ? null
                : data.postFallbackCostPerKg,
          },
        });

    return NextResponse.json(
      {
        shopVisibility: updated.shopVisibility ?? 'ALL',
        shopLeadTimeDays: updated.shopLeadTimeDays ?? 1,
        postFallbackBaseCost: updated.postFallbackBaseCost ?? null,
        postFallbackCostPerKg: updated.postFallbackCostPerKg ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ADMIN_SHOP_SETTINGS_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
