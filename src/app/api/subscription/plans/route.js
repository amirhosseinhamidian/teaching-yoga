// app/api/subscription/plans/route.js
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const plans = await prismadb.subscriptionPlan.findMany({
      where: { isActive: true },
      include: {
        planCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                shortAddress: true,
                cover: true,
              },
            },
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_GET]', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
