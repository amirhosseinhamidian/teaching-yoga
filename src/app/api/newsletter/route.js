import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const { phone } = await req.json();
    const isValidPhone = /^09\d{9}$/.test(phone);

    if (!phone || !isValidPhone) {
      return new Response(
        JSON.stringify({
          error: 'شماره موبایل معتبر وارد کنید (با 09 شروع و 11 رقم).',
        }),
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.userId || null;

    // اگر لاگین کرده:
    if (userId) {
      const existingNewsletterEntry = await prismadb.newsletter.findFirst({
        where: { userId },
      });

      // اگر شماره متعلق به کاربر دیگری است، خطا بده
      const phoneUsedByAnother = await prismadb.newsletter.findFirst({
        where: {
          phone,
          NOT: { userId },
        },
      });

      if (phoneUsedByAnother) {
        return NextResponse.json(
          {
            success: false,
            message: 'این شماره موبایل قبلاً توسط کاربر دیگری ثبت شده است.',
          },
          { status: 400 },
        );
      }

      // اگر کاربر قبلاً رکورد newsletter دارد → آپدیت کن
      if (existingNewsletterEntry) {
        await prismadb.newsletter.update({
          where: { id: existingNewsletterEntry.id },
          data: { phone },
        });

        return NextResponse.json(
          {
            success: true,
            message: 'شماره موبایل شما با موفقیت به‌روزرسانی شد.',
          },
          { status: 200 },
        );
      }

      // اگر لاگین کرده ولی هنوز رکورد newsletter ندارد
      await prismadb.newsletter.create({
        data: {
          phone,
          userId,
        },
      });

      return NextResponse.json(
        { success: true, message: 'شماره موبایل با موفقیت ثبت شد.' },
        { status: 201 },
      );
    }

    // اگر لاگین نکرده بود:
    const existingPhone = await prismadb.newsletter.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'این شماره موبایل قبلاً ثبت شده است.' },
        { status: 400 },
      );
    }

    await prismadb.newsletter.create({
      data: {
        phone,
        userId: null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'شماره موبایل با موفقیت ثبت شد.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in newsletter API:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در پردازش درخواست رخ داد.' },
      { status: 500 },
    );
  }
}
