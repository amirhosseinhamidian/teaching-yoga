import prismadb from '@/libs/prismadb';

async function getCourseComments(courseId, userId = null, page = 1, limit = 6) {
  // Calculate the number of items to skip based on the page number
  const skip = (page - 1) * limit;

  const filters = {
    courseId: Number(courseId),
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

  // Return the fetched comments and pagination information
  return {
    comments,
    currentPage: page,
    totalPages: Math.ceil(totalComments / limit),
    totalComments,
  };
}

export { getCourseComments };
