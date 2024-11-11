import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    const course = await prismadb.course.findUnique({
      where: {
        shortAddress: shortAddress,
      },
      include: {
        instructor: {
          include: {
            user: true,
          },
        },
        terms: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { shortAddress } = params;
    const { title, subtitle, price, basePrice, isHighPriority, cover } =
      await req.json();

    const updatedCourse = await prismadb.course.update({
      where: { shortAddress },
      data: {
        title,
        subtitle,
        price,
        basePrice,
        isHighPriority,
        cover,
      },
    });

    return new Response(JSON.stringify(updatedCourse), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { shortAddress } = params;

    await prismadb.course.delete({
      where: { shortAddress },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
