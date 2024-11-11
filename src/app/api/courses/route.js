import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const {
      title,
      subtitle,
      price,
      basePrice,
      isHighPriority,
      cover,
      shortAddress,
    } = await req.json();

    const newCourse = await prismadb.course.create({
      data: {
        title,
        subtitle,
        price,
        basePrice,
        isHighPriority,
        cover,
        shortAddress,
      },
    });

    return new Response(JSON.stringify(newCourse), { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    const courses = await prismadb.course.findMany({
      select: {
        id: true,
        title: true,
        subtitle: true,
        price: true,
        basePrice: true,
        isHighPriority: true,
        cover: true,
        shortAddress: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: courses,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses. Please try again later.',
      },
      { status: 500 },
    );
  }
}
