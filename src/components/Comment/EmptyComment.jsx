import React from 'react';
import PropTypes from 'prop-types';
import { AiOutlineComment } from 'react-icons/ai';

const EmptyComment = (isCourse, className) => {
  return (
    <div
      className={`py-6 text-center text-subtext-light dark:text-subtext-dark ${className}`}
    >
      <AiOutlineComment size={48} className='mx-auto' />
      <p className='text-xs md:text-sm'>
        تا کنون نظری برای این {isCourse ? 'دوره' : 'مقاله'} ثبت نشده است.
      </p>
      <p className='text-xs md:text-sm'>
        اولین نفری باشید که برای این دوره نظری ثبت می کند!
      </p>
    </div>
  );
};

EmptyComment.propTypes = {
  isCourse: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default EmptyComment;
