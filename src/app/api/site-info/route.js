import prisma from '@/libs/prismadb';
import { NextResponse } from 'next/server';

// ثبت اطلاعات جدید (POST)
export async function POST(req) {
  try {
    const {
      shortDescription,
      fullDescription,
      companyAddress,
      companyEmail,
      companyPhone,
      socialLinks,
      coursesLinks,
      articlesLinks,
      usefulLinks,
      heroImageUrl,
      rules,
    } = await req.json();

    // اطلاعات را در پایگاه داده ذخیره می‌کنیم
    const siteInfo = await prisma.siteInfo.create({
      data: {
        shortDescription,
        fullDescription,
        companyAddress,
        companyEmail,
        companyPhone,
        socialLinks,
        coursesLinks,
        articlesLinks,
        usefulLinks,
        heroImageUrl,
        rules,
      },
    });

    return NextResponse.json(siteInfo, { status: 201 }); // موفقیت در ثبت
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error creating site information' },
      { status: 500 },
    );
  }
}

// آپدیت اطلاعات موجود (PUT)
export async function PUT(req) {
  try {
    const {
      id,
      shortDescription,
      fullDescription,
      companyAddress,
      companyEmail,
      companyPhone,
      socialLinks,
      coursesLinks,
      articlesLinks,
      usefulLinks,
      heroImage,
      rules,
    } = await req.json();

    // به‌روزرسانی اطلاعات سایت بر اساس id
    const updatedSiteInfo = await prisma.siteInfo.update({
      where: { id },
      data: {
        shortDescription,
        fullDescription,
        companyAddress,
        companyEmail,
        companyPhone,
        socialLinks,
        coursesLinks,
        articlesLinks,
        usefulLinks,
        heroImage,
        rules,
      },
    });

    return NextResponse.json(updatedSiteInfo, { status: 200 }); // موفقیت در به‌روزرسانی
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error updating site information' },
      { status: 500 },
    );
  }
}

// دریافت اطلاعات موجود (GET)
export async function GET(req) {
  try {
    // بررسی پارامترهای جستجو
    const { searchParams } = req.nextUrl;
    const onlyRules = searchParams.get('rules');

    // دریافت اطلاعات از دیتابیس
    const siteInfo = await prisma.siteInfo.findFirst();

    if (!siteInfo) {
      return NextResponse.json(
        { message: 'No site information found' },
        { status: 400 },
      );
    }

    // اگر درخواست فقط مقدار `rules` را بخواهد
    if (onlyRules !== null) {
      return NextResponse.json(
        { rules: siteInfo.rules || '' },
        { status: 200 },
      );
    }

    // در غیر این صورت، کل اطلاعات سایت ارسال می‌شود
    return NextResponse.json(siteInfo, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error retrieving site information' },
      { status: 500 },
    );
  }
}
