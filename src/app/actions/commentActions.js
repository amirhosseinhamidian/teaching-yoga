import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

const normalizeCommentMedia = (comment) => {
  if (!comment) {
    return comment;
  }

  return {
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
  };
};

async function getCourseComments(courseId, userId = null, page = 1, limit = 6) {
  const skip = (page - 1) * limit;

  const filters = {
    courseId: Number(courseId),
    parentId: null,
    OR: [{ status: 'APPROVED' }],
  };

  if (userId) {
    filters.OR.push({
      userId,
    });
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

  return {
    comments: comments.map(normalizeCommentMedia),
    currentPage: page,
    totalPages: Math.ceil(totalComments / limit),
    totalComments,
  };
}

export { getCourseComments };
