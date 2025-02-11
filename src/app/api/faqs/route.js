import { VALID_CATEGORIES } from '@/constants/faqCategories';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, answer, category } = await request.json();

    if (!question || !answer || !category) {
      return NextResponse.json(
        { error: 'Question, answer, and category are required' },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Valid categories are: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const newFAQ = await prismadb.fAQ.create({
      data: {
        question,
        answer,
        category,
      },
    });

    return NextResponse.json(newFAQ, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating FAQ' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const whereClause = category
      ? VALID_CATEGORIES.includes(category)
        ? { category }
        : null
      : undefined;

    if (category && !whereClause) {
      return NextResponse.json(
        {
          error: `Invalid category. Valid categories are: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 },
      );
    }
    const faqs = await prismadb.fAQ.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(faqs);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching FAQs' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, question, answer, category } = await request.json();

    if (!id || !question || !answer || !category) {
      return NextResponse.json(
        { error: 'ID, question, answer, and category are required' },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Valid categories are: ${VALID_CATEGORIES.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const updatedFAQ = await prismadb.fAQ.update({
      where: {
        id: parseInt(id),
      },
      data: {
        question,
        answer,
        category,
      },
    });

    return NextResponse.json(updatedFAQ);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating FAQ' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'FAQ ID is required' },
        { status: 400 },
      );
    }

    const deletedFAQ = await prismadb.fAQ.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(deletedFAQ);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting FAQ' }, { status: 500 });
  }
}
