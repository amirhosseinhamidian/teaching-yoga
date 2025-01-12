import React from 'react';
import CommentSummarySection from '../components/templates/comment/CommentSummarySection';
import CommentTableSection from '../components/templates/comment/CommentTableSection';

function CommentPage() {
  return (
    <div>
      <h2 className='text-base font-semibold xs:text-lg sm:text-xl lg:text-2xl xl:text-3xl'>
        نظرات دوره ها
      </h2>
      <CommentSummarySection className='mt-8' type='course' />
      <CommentTableSection type='course' />
      <h2 className='mt-10 text-base font-semibold xs:text-lg sm:text-xl lg:text-2xl xl:text-3xl'>
        نظرات مقاله ها
      </h2>
      <CommentSummarySection className='mt-8' type='article' />
      <CommentTableSection type='article' />
    </div>
  );
}

export default CommentPage;
