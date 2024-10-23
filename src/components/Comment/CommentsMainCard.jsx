'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import CommentCard from './CommentCard';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const CommentsMainCard = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <div className='flex items-baseline justify-between'>
        <h3 className='mb-4 font-semibold md:text-lg'>نظرات کاربران</h3>
        <Button className='text-xs sm:text-base'>ایجاد نظر جدید</Button>
      </div>
      <CommentCard className='my-4 sm:m-4' />

      <Button onClick={toggleExpand} className=''>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </Button>
    </div>
  );
};

CommentsMainCard.propTypes = {
  className: PropTypes.string,
};

export default CommentsMainCard;
