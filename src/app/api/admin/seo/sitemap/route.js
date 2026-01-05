/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || '').replace(/\/+$/, ''); // remove trailing slashes
}

function normalizePath(path) {
  const p = String(path || '').trim();
  if (!p) return '/';
  return p.startsWith('/') ? p : `/${p}`;
}

function joinUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);
  const p = normalizePath(path);
  return `${base}${p}`;
}

function isDynamicSection(section) {
  const s = String(section || '');
  return s.includes('[slug]') || s.includes('[shortAddress]');
}

function buildLocFromSetting(item, baseUrl) {
  const section = String(item.section || '');
  const shortAddress = String(item.shortAddress || '').trim();

  // اگر section خودش '/' باشه => صفحه اصلی
  if (section === '/' || section === 'home') {
    return normalizeBaseUrl(baseUrl);
  }

  // اگر داینامیکه باید جایگزین کنیم
  if (isDynamicSection(section)) {
    if (!shortAddress) {
      throw new Error(`shortAddress/slug is required for section ${section}`);
    }

    const filled = section
      .replace('[slug]', shortAddress)
      .replace('[shortAddress]', shortAddress);

    return joinUrl(baseUrl, filled);
  }

  // مسیر ثابت
  return joinUrl(baseUrl, section);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { section, changefreq, priority, shortAddress } = body;

    if (!section || !changefreq || priority == null) {
      return NextResponse.json(
        { success: false, message: 'تمامی فیلدها الزامی هستند.' },
        { status: 400 }
      );
    }

    const cleanSection = normalizePath(section); // '/shop/products/[slug]' ...
    const needsSlug = isDynamicSection(cleanSection);

    const cleanShort = String(shortAddress || '').trim();

    if (needsSlug && !cleanShort) {
      return NextResponse.json(
        {
          success: false,
          message: 'برای صفحات جزئیات، slug/آدرس کوتاه الزامی است.',
        },
        { status: 400 }
      );
    }

    const result = await prismadb.sitemapSetting.upsert({
      where: { section: cleanSection },
      update: {
        changefreq,
        priority: Number(priority),
        shortAddress: needsSlug ? cleanShort : '', // برای مسیرهای ثابت خالی
      },
      create: {
        section: cleanSection,
        changefreq,
        priority: Number(priority),
        shortAddress: needsSlug ? cleanShort : '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تنظیمات سایت‌مپ با موفقیت ذخیره شد.',
      data: result,
    });
  } catch (error) {
    console.error('Error saving sitemap settings:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در ذخیره تنظیمات سایت‌مپ رخ داد.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

    const settings = await prismadb.sitemapSetting.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const urls = settings.map((item) => {
      const loc = buildLocFromSetting(item, baseUrl);

      const lastmod = item.updatedAt
        ? item.updatedAt.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const changefreq = item.changefreq;
      const priority = item.priority;

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در تولید سایت‌مپ رخ داد.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // 🔥 حذف کامل رکوردهای sitemap
    await prismadb.sitemapSetting.deleteMany();

    return NextResponse.json({
      success: true,
      message: 'تمام اطلاعات سایت‌مپ با موفقیت حذف شد.',
    });
  } catch (error) {
    console.error('[SITEMAP_DELETE_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف اطلاعات سایت‌مپ.' },
      { status: 500 }
    );
  }
}
