import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PATCH(request) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    // دریافت مقدار فعلی isActive
    const discountCode = await prismadb.discountCode.findUnique({
      where: { id: parseInt(id) },
    });

    if (!discountCode) {
      return NextResponse.json(
        { message: 'discount Code not found' },
        { status: 404 },
      );
    }

    // تغییر مقدار isActive
    const updatedDiscountCode = await prismadb.discountCode.update({
      where: { id: parseInt(id) },
      data: { isActive: !discountCode.isActive },
    });

    return NextResponse.json(
      {
        message: 'Discount Code updated successfully',
        session: updatedDiscountCode,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error toggling session active status:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
