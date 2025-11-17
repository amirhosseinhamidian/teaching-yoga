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
    const { name, subtitle, duration, price, discount, selectedTermId } = body;

    // اگر ترم انتخاب‌شده وجود دارد
    if (selectedTermId) {
      if (!selectedTermId || isNaN(parseInt(selectedTermId))) {
        return NextResponse.json(
          { error: 'Selected term ID is invalid.' },
          { status: 400 },
        );
      }

      // بررسی اتصال تکراری
      const existingConnection = await prismadb.courseTerm.findUnique({
        where: {
          courseId_termId: {
            courseId: parseInt(id),
            termId: parseInt(selectedTermId),
          },
        },
      });

      if (existingConnection) {
        return NextResponse.json(
          { error: 'این ترم قبلاً به این دوره اضافه شده است.' },
          { status: 400 },
        );
      }

      // اضافه کردن ترم انتخاب‌شده به دوره
      const newCourseTerm = await prismadb.courseTerm.create({
        data: {
          courseId: parseInt(id),
          termId: parseInt(selectedTermId),
          isOptional: false, // می‌توانید این مقدار را تغییر دهید
        },
      });

      return NextResponse.json(newCourseTerm, { status: 201 });
    } else {
      // اگر ترم جدید اضافه شود
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

      // ایجاد ترم جدید
      const newTerm = await prismadb.term.create({
        data: {
          name,
          price,
          discount,
          subtitle: subtitle || null,
          duration: duration || 0,
        },
      });

      // اتصال ترم جدید به دوره
      const newCourseTerm = await prismadb.courseTerm.create({
        data: {
          courseId: parseInt(id),
          termId: newTerm.id,
          isOptional: false, // مقدار پیش‌فرض
        },
      });

      return NextResponse.json(
        { term: newTerm, courseTerm: newCourseTerm },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error('Error handling term:', error);
    return NextResponse.json(
      { error: 'یک مشکل ناشناخته در هنگام مدیریت ترم بوجود آمده است.' },
      { status: 500 },
    );
  }
}

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: 'Course ID is required' },
      { status: 400 },
    );
  }

  try {
    const termsCourse = await prismadb.courseTerm.findMany({
      where: {
        courseId: parseInt(id),
      },
      include: {
        term: {
          include: {
            sessionTerms: {
              include: {
                session: {
                  include: {
                    video: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        term: {
          id: 'asc',
        },
      },
    });

    // 🔥 تبدیل ساختار به ساختار جدید شامل order از SessionTerm
    const terms = termsCourse.map((courseTerm) => {
      const t = courseTerm.term;

      return {
        ...t,
        sessions: t.sessionTerms.map((st) => ({
          ...st.session,
          order: st.order, // ⬅ اضافه کردن order از SessionTerm
        })),
      };
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
