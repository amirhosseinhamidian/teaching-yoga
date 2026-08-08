import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PUT(request) {
  try {
    const id = request.headers.get('id');
    const status = request.headers.get('status');

    if (!id || !status) {
      return NextResponse.json(
        {
          message: 'فیلدهای id و status ضروری هستند',
        },
        {
          status: 400,
        }
      );
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: 'وضعیت معتبر نیست',
        },
        {
          status: 400,
        }
      );
    }

    const updateData = {
      status,
    };

    if (status !== 'APPROVED') {
      updateData.showOnHome = false;
      updateData.homeOrder = null;
    }

    await prismadb.comment.update({
      where: {
        id: Number(id),
      },
      data: updateData,
    });

    return NextResponse.json(
      {
        message: 'وضعیت کامنت با موفقیت به‌روزرسانی شد',
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('[COMMENT_STATUS_UPDATE_ERROR]', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          message: 'کامنتی با این id یافت نشد',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        message: 'خطا در انجام عملیات',
      },
      {
        status: 500,
      }
    );
  }
}
