import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // بررسی اینکه مقاله با این ID وجود دارد یا نه
    const existingArticle = await prismadb.article.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { message: 'مقاله موردنظر یافت نشد' },
        { status: 404 },
      );
    }

    // حذف مقاله
    await prismadb.article.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'مقاله با موفقیت حذف شد' },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'خطایی در حذف مقاله رخ داده است', error },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // بررسی اینکه مقاله با این ID وجود دارد یا نه
    const existingArticle = await prismadb.article.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { message: 'مقاله موردنظر یافت نشد' },
        { status: 404 },
      );
    }

    // بروزرسانی مقاله
    const updatedArticle = await prismadb.article.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title || existingArticle.title,
        content: body.content || existingArticle.content,
        cover: body.cover || existingArticle.cover,
        readTime: body.readTime || existingArticle.readTime,
        isActive: body.isActive ?? existingArticle.isActive,
        subtitle: body.subtitle || existingArticle.subtitle,
      },
    });

    return NextResponse.json(
      { message: 'مقاله با موفقیت بروزرسانی شد', data: updatedArticle },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'خطایی در بروزرسانی مقاله رخ داده است', error },
      { status: 500 },
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // بررسی اینکه مقاله با این ID وجود دارد یا نه
    const article = await prismadb.article.findUnique({
      where: { id: parseInt(id) },
    });

    if (!article) {
      return NextResponse.json(
        { message: 'مقاله موردنظر یافت نشد' },
        { status: 400 },
      );
    }

    return NextResponse.json({ data: article }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'خطایی در بروزرسانی مقاله رخ داده است', error },
      { status: 500 },
    );
  }
}
