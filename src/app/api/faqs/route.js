import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { question, answer } = await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 },
      );
    }

    const newFAQ = await prismadb.fAQ.create({
      data: {
        question,
        answer,
      },
    });

    return NextResponse.json(newFAQ, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating FAQ' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const faqs = await prismadb.fAQ.findMany({
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
  const { id, question, answer } = await request.json();

  if (!id || !question || !answer) {
    return NextResponse.json(
      { error: 'ID, question, and answer are required' },
      { status: 400 },
    );
  }

  try {
    const updatedFAQ = await prismadb.fAQ.update({
      where: {
        id: id,
      },
      data: {
        question,
        answer,
      },
    });

    return NextResponse.json(updatedFAQ);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating FAQ' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get('id'));

  if (!id) {
    return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
  }

  try {
    const deletedFAQ = await prismadb.fAQ.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(deletedFAQ);
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting FAQ' }, { status: 500 });
  }
}
