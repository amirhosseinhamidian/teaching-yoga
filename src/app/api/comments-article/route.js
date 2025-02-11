import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const articleId = parseInt(searchParams.get('articleId'));
    const page = parseInt(searchParams.get('page')) || 1;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.userId || null;
    const skip = (page - 1) * 6;
    const filters = {
      articleId: Number(articleId),
      parentId: null,
      OR: [{ status: 'APPROVED' }],
    };

    // Add userId to filters if it exists
    if (userId) {
      filters.OR.push({ userId: userId });
    }
    // Fetch main comments (where parentId is null)
    const comments = await prismadb.comment.findMany({
      where: filters,
      skip: skip,
      take: 6,
      orderBy: {
        createAt: 'desc',
      },
      include: {
        replies: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });

    const totalComments = await prismadb.comment.count({
      where: filters,
    });

    const commentsData = {
      comments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / 6),
      totalComments,
    };
    return NextResponse.json(commentsData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const body = await request.json();
  const { articleId, content, userId } = body;

  try {
    const newComment = await prismadb.comment.create({
      data: {
        articleId,
        content,
        userId,
      },
      include: {
        user: true,
      },
    });
    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 },
    );
  }
}
