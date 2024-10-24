import prismadb from '../../../../libs/prismadb';
import { getCourseComments } from '../../actions/commentActions';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const page = parseInt(searchParams.get('page')) || 1;

  try {
    const commentsData = await getCourseComments(courseId, page);
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
  const { courseId, content, userId } = body;

  try {
    const newComment = await prismadb.comment.create({
      data: {
        courseId,
        content,
        userId,
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

export async function PUT(request) {
  const body = await request.json();
  const { commentId, content } = body;

  try {
    const updatedComment = await prismadb.comment.update({
      where: { id: commentId },
      data: { content },
    });
    return NextResponse.json(updatedComment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating comment' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('commentId');

  try {
    await prismadb.comment.delete({
      where: { id: commentId },
    });
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting comment' },
      { status: 500 },
    );
  }
}
