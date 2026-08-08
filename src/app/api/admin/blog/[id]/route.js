import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const existingArticle = await prismadb.article.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        {
          message: 'مقاله موردنظر یافت نشد',
        },
        { status: 404 }
      );
    }

    await prismadb.article.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json(
      {
        message: 'مقاله با موفقیت حذف شد',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'خطایی در حذف مقاله رخ داده است',
        error,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const existingArticle = await prismadb.article.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        {
          message: 'مقاله موردنظر یافت نشد',
        },
        { status: 404 }
      );
    }

    const updatedArticle = await prismadb.article.update({
      where: {
        id: parseInt(id),
      },
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
      {
        message: 'مقاله با موفقیت بروزرسانی شد',
        data: {
          ...updatedArticle,
          cover: toAbsoluteMediaUrl(updatedArticle.cover),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'خطایی در بروزرسانی مقاله رخ داده است',
        error,
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const article = await prismadb.article.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          message: 'مقاله موردنظر یافت نشد',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        data: {
          ...article,
          cover: toAbsoluteMediaUrl(article.cover),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: 'خطایی رخ داده است',
        error,
      },
      { status: 500 }
    );
  }
}
