import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const { email } = await req.json();

    // بررسی اعتبار ایمیل
    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'ایمیل معتبر وارد کنید.' }), {
        status: 400,
      });
    }

    // بررسی وضعیت لاگین کاربر
    const session = await getServerSession(authOptions);

    // بررسی اینکه آیا کاربر لاگین دارد
    if (session?.user?.userId) {
      // بررسی وجود رکوردی برای این کاربر در جدول newsletter
      const existingUserNewsletterEntry = await prismadb.newsletter.findFirst({
        where: { userId: session.user.userId },
      });

      if (existingUserNewsletterEntry) {
        // اگر رکوردی برای کاربر وجود دارد، آن را آپدیت کن
        await prismadb.newsletter.update({
          where: { id: existingUserNewsletterEntry.id },
          data: { email },
        });

        // به‌روزرسانی ایمیل در جدول user
        await prismadb.user.update({
          where: { id: session.user.userId },
          data: { email },
        });

        return NextResponse.json(
          { success: true, message: 'ایمیل شما با موفقیت به‌روزرسانی شد.' },
          { status: 200 },
        );
      }
    }

    // بررسی تکراری بودن ایمیل در جدول newsletter
    const existingNewsletterEntry = await prismadb.newsletter.findUnique({
      where: { email },
    });

    if (existingNewsletterEntry) {
      return NextResponse.json(
        { success: false, message: 'این ایمیل قبلاً ثبت شده است.' },
        { status: 400 },
      );
    }

    // اگر رکوردی برای کاربر لاگین وجود نداشت، ایمیل را ثبت کن
    await prismadb.newsletter.create({
      data: {
        email,
        userId: session?.user?.userId || null,
      },
    });

    // به‌روزرسانی ایمیل در جدول user (در صورت وجود)
    if (session?.user?.userId) {
      await prismadb.user.update({
        where: { id: session.user.userId },
        data: { email },
      });
    }

    return NextResponse.json(
      { success: true, message: 'ایمیل با موفقیت ثبت شد.' },
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
