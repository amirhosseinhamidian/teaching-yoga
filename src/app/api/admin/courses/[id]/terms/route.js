import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    // Extract course ID from route params
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid course ID.' },
        { status: 400 },
      );
    }

    // Parse the request body
    const body = await request.json();
    const { name, subtitle, duration } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string.' },
        { status: 400 },
      );
    }

    if (duration !== undefined && (isNaN(duration) || duration < 0)) {
      return NextResponse.json(
        { error: 'Duration must be a non-negative integer.' },
        { status: 400 },
      );
    }

    // Create the term in the database
    const newTerm = await prismadb.term.create({
      data: {
        name,
        subtitle: subtitle || null,
        duration: duration || 0,
        courseId: parseInt(id), // Convert ID to integer
      },
    });

    return NextResponse.json(newTerm, { status: 201 });
  } catch (error) {
    console.error('Error creating term:', error);
    return NextResponse.json(
      { error: 'یک مشکل ناشناخته در هنگام ساخت ترم بوجود آمده است' },
      { status: 500 },
    );
  }
}

export async function GET(request, { params }) {
  const { id } = params; // گرفتن آیدی دوره از پارامتر URL

  if (!id) {
    return NextResponse.json(
      { error: 'Course ID is required' },
      { status: 400 },
    );
  }

  try {
    // گرفتن ترم‌ها به همراه جلسات و ویدیوها
    const terms = await prismadb.term.findMany({
      where: {
        courseId: parseInt(id),
      },
      include: {
        sessions: {
          include: {
            video: true, // اطلاعات ویدیو
          },
        },
      },
      orderBy: {
        id: 'asc', // مرتب‌سازی بر اساس شناسه ترم (از کوچک به بزرگ)
      },
    });

    return NextResponse.json(terms, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}
