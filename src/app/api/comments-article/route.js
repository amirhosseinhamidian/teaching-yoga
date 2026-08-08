/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

const normalizeComment = (comment) => ({
  ...comment,
  user: comment.user
    ? {
        ...comment.user,
        avatar: toAbsoluteMediaUrl(comment.user.avatar),
      }
    : null,
  replies: Array.isArray(comment.replies)
    ? comment.replies.map((reply) => ({
        ...reply,
        user: reply.user
          ? {
              ...reply.user,
              avatar: toAbsoluteMediaUrl(reply.user.avatar),
            }
          : null,
      }))
    : [],
});

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const articleId = Number(searchParams.get('articleId'));
    const page = Number(searchParams.get('page')) || 1;

    if (!articleId) {
      return NextResponse.json(
        { error: 'articleId is required' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id || null;

    const limit = 6;
    const skip = (page - 1) * limit;

    const filters = {
      articleId,
      parentId: null,
      OR: [{ status: 'APPROVED' }],
    };

    if (userId) {
      filters.OR.push({ userId });
    }

    const comments = await prismadb.comment.findMany({
      where: filters,
      skip,
      take: limit,
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

    return NextResponse.json({
      comments: comments.map(normalizeComment),
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit),
      totalComments,
    });
  } catch (err) {
    console.error('ARTICLE COMMENTS GET ERROR:', err);

    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { articleId, content, parentId = null } = body;

    if (!articleId || !content?.trim()) {
      return NextResponse.json(
        { error: 'articleId and content are required' },
        { status: 400 }
      );
    }

    const newComment = await prismadb.comment.create({
      data: {
        articleId: Number(articleId),
        content: content.trim(),
        parentId: parentId ? Number(parentId) : null,
        userId: authUser.id,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(normalizeComment(newComment));
  } catch (err) {
    console.error('ARTICLE COMMENT POST ERROR:', err);

    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 }
    );
  }
}
