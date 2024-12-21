/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { generateCode } from '@/utils/generateCode';
import axios from 'axios';
import prismadb from '@/libs/prismadb';

const apiKey = process.env.KAVENEGAR_API_KEY;
const template = 'samanehyoga';

export async function POST(request) {
  const { phone } = await request.json();

  try {
    // Check for existing verification code for the user
    const existingCode = await prismadb.verificationCode.findUnique({
      where: { phone },
    });

    if (existingCode) {
      const now = new Date();
      const expiresAt = new Date(existingCode.expiresAt);

      // If the expiration time has not passed yet
      if (now < expiresAt) {
        const remainingTime = Math.ceil((expiresAt - now) / 1000); // Remaining time in seconds
        return NextResponse.json({
          success: false,
          error: `لطفاً ${remainingTime} ثانیه دیگر برای ارسال درخواست جدید صبر کنید.`,
        });
      }
    }

    const token = generateCode();

    const smsResponse = await axios.get(
      `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`,
      {
        params: {
          receptor: phone,
          token,
          template,
        },
      },
    );

    if (smsResponse.status !== 200 || !smsResponse.data) {
      return NextResponse.json({
        success: false,
        error: 'ارسال کد تایید موفقیت‌آمیز نبود.',
      });
    } else {
      try {
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
        await prismadb.verificationCode.upsert({
          where: { phone },
          update: { code: token, expiresAt },
          create: { phone, code: token, expiresAt },
        });
      } catch (error) {
        console.error('Error saving verification code:', error);
        return NextResponse.json(
          { success: false, error: 'خطا در ثبت کد تایید' },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error in send-otp API:', error.response.data);
    return NextResponse.json({
      success: false,
      error: error.response.data.return.message || 'خطا در پردازش درخواست.',
    });
  }
}
