import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    // Extract course ID and term ID from route params
    const { id, termId } = params;

    // Validate the course ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid course ID.' },
        { status: 400 },
      );
    }

    // Validate the term ID
    if (!termId || isNaN(parseInt(termId))) {
      return NextResponse.json({ error: 'Invalid term ID.' }, { status: 400 });
    }

    // Check if the connection exists
    const existingConnection = await prismadb.courseTerm.findUnique({
      where: {
        courseId_termId: {
          courseId: parseInt(id),
          termId: parseInt(termId),
        },
      },
    });

    if (!existingConnection) {
      return NextResponse.json({ error: 'ترم وجود ندارد.' }, { status: 404 });
    }

    // Delete the connection
    await prismadb.courseTerm.delete({
      where: {
        courseId_termId: {
          courseId: parseInt(id),
          termId: parseInt(termId),
        },
      },
    });

    return NextResponse.json(
      { message: 'ترم با موفقیت حذف شد.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting term connection:', error);
    return NextResponse.json(
      {
        error: 'یک خطای ناشناخته رخ داده است.',
      },
      { status: 500 },
    );
  }
}
