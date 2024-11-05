import { NextResponse } from 'next/server';
import prismadb from '../../../../libs/prismadb';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber'; // Import your phone validation helper

export async function POST(req) {
  const { username, userPhone } = await req.json();

  // Check if phone number is valid
  if (!validatePhoneNumber(userPhone)) {
    return NextResponse.json(
      { success: false, error: 'شماره موبایل معتبر نیست.' },
      { status: 400 },
    );
  }

  // Check for unique username
  const existingUsername = await prismadb.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    return NextResponse.json(
      { success: false, error: 'این نام کاربری قبلاً استفاده شده است.' },
      { status: 409 },
    );
  }

  // Check for unique phone number
  const existingPhone = await prismadb.user.findUnique({
    where: { phone: userPhone },
  });

  if (existingPhone) {
    return NextResponse.json(
      { success: false, error: 'این شماره موبایل قبلاً استفاده شده است.' },
      { status: 409 },
    );
  }

  // If both checks pass, you can proceed to create the user
  // Note: Implement user creation logic here

  return NextResponse.json({ success: true });
}
