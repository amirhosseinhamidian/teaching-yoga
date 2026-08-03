import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      success: false,

      error: 'ثبت‌نام باید پس از تأیید کد از مسیر ورود امن انجام شود.',
    },
    {
      status: 410,

      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
