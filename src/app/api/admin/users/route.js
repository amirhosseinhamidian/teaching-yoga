import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    const { username, phoneNumber, firstname, lastname, role } =
      await request.json();
    if (!username || !phoneNumber || !role) {
      return NextResponse.json(
        { error: 'خطا در تکمیل فیلدها' },
        { status: 400 },
      );
    }
    const newUser = await prismadb.user.create({
      data: {
        username,
        phone: phoneNumber,
        firstname,
        lastname,
        role,
      },
    });
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error(error);
    let errorResponse = { error: 'Internal server error', field: null };

    if (error.meta.target[0] === 'phone') {
      errorResponse = {
        error: 'این شماره موبایل قبلا ثبت شده است',
        field: 'phone',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    } else if (error.meta.target[0] === 'username') {
      errorResponse = {
        error: 'این نام کاربری قبلا ثبت شده است',
        field: 'username',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // استخراج شماره صفحه از Query Parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (page < 1) {
      return NextResponse.json(
        { error: 'شماره صفحه باید یک عدد مثبت باشد' },
        { status: 400 },
      );
    }

    const pageSize = 10; // تعداد کاربران در هر صفحه
    const skip = (page - 1) * pageSize; // محاسبه کاربران جا افتاده

    // دریافت کاربران با ترتیب از آخر به اول
    const users = await prismadb.user.findMany({
      skip,
      take: pageSize,
      orderBy: {
        createAt: 'desc', // ترتیب از آخر به اول
      },
      include: {
        courses: true, // واکشی اطلاعات مرتبط با UserCourse
      },
    });

    // شمارش کل کاربران برای اطلاعات تکمیلی
    const totalUsers = await prismadb.user.count();

    return NextResponse.json({
      users,
      meta: {
        totalUsers,
        page,
        pageSize,
        totalPages: Math.ceil(totalUsers / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
