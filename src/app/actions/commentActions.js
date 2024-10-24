'use server';

import prismadb from '../../../libs/prismadb';

async function getCourseComments(courseId, page = 1, limit = 6) {
  // Calculate the number of items to skip based on the page number
  const skip = (page - 1) * limit;
  // Fetch main comments (where parentId is null)
  const comments = await prismadb.comment.findMany({
    where: {
      courseId: Number(courseId), // Fetch comments related to the specific course
      parentId: null, // Only main comments (not replies)
    },
    skip: skip, // Skip comments based on the page number
    take: limit, // Limit the number of comments returned
    orderBy: {
      createAt: 'desc', // Sort comments by creation date in descending order
    },
    include: {
      replies: {
        include: {
          user: true, // Fetch user information for replies
        },
      },
      user: true, // Fetch user information for the main comment
    },
  });

  // Count the total number of main comments for the specific course
  const totalComments = await prismadb.comment.count({
    where: {
      courseId: Number(courseId),
      parentId: null, // Only count main comments
    },
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
