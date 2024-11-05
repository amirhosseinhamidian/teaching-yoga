import { NextResponse } from 'next/server';
import prismadb from '../../../../libs/prismadb';
export async function POST(req) {
  try {
    const { username, userPhone: phone } = await req.json();
    const newUser = await prismadb.user.create({
      data: {
        username,
        phone,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ساخت کاربر جدید.' },
      { status: 500 },
    );
  }
}
