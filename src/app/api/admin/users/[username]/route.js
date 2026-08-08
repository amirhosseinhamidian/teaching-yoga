import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function DELETE(request, { params }) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        {
          error: 'یوزرنیم مشخص نشده است',
        },
        {
          status: 400,
        }
      );
    }

    await prismadb.user.delete({
      where: {
        id: username,
      },
    });

    return NextResponse.json(
      {
        message: `کاربر ${username} با موفقیت حذف شد`,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);

    return NextResponse.json(
      {
        error: 'خطای داخلی سرور',
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        {
          error: 'یوزرنیم مشخص نشده است',
        },
        {
          status: 400,
        }
      );
    }

    const { phoneNumber, firstname, lastname, role, newUsername } =
      await request.json();

    if (!phoneNumber || !newUsername || !role) {
      return NextResponse.json(
        {
          error: 'تمام فیلدها باید تکمیل شوند',
        },
        {
          status: 400,
        }
      );
    }

    const user = await prismadb.user.findUnique({
      where: {
        id: username,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'کاربر پیدا نشد',
        },
        {
          status: 404,
        }
      );
    }

    const updatedUser = await prismadb.user.update({
      where: {
        id: username,
      },
      data: {
        phone: phoneNumber,
        firstname,
        lastname,
        role,
        username: newUsername || username,
      },
    });

    return NextResponse.json(
      {
        ...updatedUser,
        avatar: toAbsoluteMediaUrl(updatedUser.avatar),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      {
        error: 'خطای داخلی سرور',
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        {
          error: 'یوزرنیم مشخص نشده است',
        },
        {
          status: 400,
        }
      );
    }

    const user = await prismadb.user.findUnique({
      where: {
        id: username,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'کاربر پیدا نشد',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        ...user,
        avatar: toAbsoluteMediaUrl(user.avatar),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error getting user:', error);

    return NextResponse.json(
      {
        error: 'خطای داخلی سرور',
      },
      {
        status: 500,
      }
    );
  }
}
