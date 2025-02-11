import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get('shortAddress');

    if (!address || address.length < 4) {
      return NextResponse.json(
        { isValid: false, message: 'آدرس باید حداقل ۴ کاراکتر باشد.' },
        { status: 400 },
      );
    }

    const existingArticle = await prismadb.article.findFirst({
      where: { shortAddress: address },
    });

    if (existingArticle) {
      return NextResponse.json({
        isValid: false,
        message: 'این آدرس قبلاً استفاده شده است.',
      });
    }

    return NextResponse.json({ isValid: true, message: 'آدرس معتبر است.' });
  } catch (error) {
    console.error('Error validating short address:', error);
    return NextResponse.json(
      {
        isValid: false,
        message: 'خطا در سرور رخ داده است. لطفاً دوباره تلاش کنید.',
      },
      { status: 500 },
    );
  }
}
