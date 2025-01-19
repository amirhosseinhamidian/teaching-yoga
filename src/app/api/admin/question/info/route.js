import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
export async function GET() {
  try {
    // دریافت تعداد کل سوالات
    const totalQuestions = await prismadb.question.count();

    // دریافت تعداد سوالات پاسخ‌دار
    const answeredQuestions = await prismadb.question.count({
      where: { isAnswered: true },
    });

    // دریافت تعداد سوالات بدون پاسخ
    const unansweredQuestions = totalQuestions - answeredQuestions;

    // پاسخ به کلاینت
    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        answeredQuestions,
        unansweredQuestions,
      },
    });
  } catch (error) {
    console.error('Error fetching question statistics:', error);

    // بازگشت خطا در صورت بروز مشکل
    return NextResponse.json(
      { success: false, message: 'Failed to fetch question statistics' },
      { status: 500 },
    );
  }
}
