/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getCourseComments } from '../../actions/commentActions';
import { getAuthUser } from '@/utils/getAuthUser';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

// =============================
// GET → Get Comments
// =============================
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const courseId = Number(searchParams.get('courseId'));
    const page = Number(searchParams.get('page')) || 1;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    const authUser = await getAuthUser();
    const userId = authUser?.id || null;

    const commentsData = await getCourseComments(courseId, userId, page);

    return NextResponse.json(commentsData);
  } catch (error) {
    console.error('GET COMMENTS ERROR:', error);

    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}

// =============================
// POST → Create Comment
// =============================
export async function POST(request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, content } = body;

    if (!courseId || !content) {
      return NextResponse.json(
        { error: 'courseId and content are required' },
        { status: 400 }
      );
    }

    const newComment = await prismadb.comment.create({
      data: {
        courseId: Number(courseId),
        content,
        userId: user.id,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      ...newComment,
      user: newComment.user
        ? {
            ...newComment.user,
            avatar: toAbsoluteMediaUrl(newComment.user.avatar),
          }
        : null,
    });
  } catch (error) {
    console.error('CREATE COMMENT ERROR:', error);

    return NextResponse.json(
      { error: 'Error creating comment' },
      { status: 500 }
    );
  }
}

// =============================
// PUT → Update Comment
// =============================
export async function PUT(request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'commentId and content are required' },
        { status: 400 }
      );
    }

    const comment = await prismadb.comment.findUnique({
      where: {
        id: Number(commentId),
      },
    });

    if (!comment || comment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not allowed to edit this comment' },
        { status: 403 }
      );
    }

    const updatedComment = await prismadb.comment.update({
      where: {
        id: Number(commentId),
      },
      data: {
        content,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      ...updatedComment,
      user: updatedComment.user
        ? {
            ...updatedComment.user,
            avatar: toAbsoluteMediaUrl(updatedComment.user.avatar),
          }
        : null,
    });
  } catch (error) {
    console.error('UPDATE COMMENT ERROR:', error);

    return NextResponse.json(
      { error: 'Error updating comment' },
      { status: 500 }
    );
  }
}

// =============================
// DELETE → Delete Comment
// =============================
export async function DELETE(request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const commentId = Number(searchParams.get('commentId'));

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    const existing = await prismadb.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not allowed to delete this comment' },
        { status: 403 }
      );
    }

    await prismadb.comment.delete({
      where: {
        id: commentId,
      },
    });

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('DELETE COMMENT ERROR:', error);

    return NextResponse.json(
      { error: 'Error deleting comment' },
      { status: 500 }
    );
  }
}
