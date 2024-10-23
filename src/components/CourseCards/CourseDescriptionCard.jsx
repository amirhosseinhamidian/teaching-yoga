'use client';
import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import PropTypes from 'prop-types';

const CourseDescriptionCard = ({ description, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>توضیحات دوره</h3>
      <div
        className={`relative overflow-hidden transition-max-height duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px]' : 'max-h-24'}`}
      >
        <p className='text-sm leading-6 text-subtext-light dark:text-subtext-dark'>
          {description}
        </p>
        {!isExpanded && (
          <div className='absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-light to-transparent dark:from-surface-dark'></div>
        )}
      </div>
      <button
        onClick={toggleExpand}
        className='mx-auto mt-4 flex items-center rounded-full border-2 border-primary p-4 text-primary transition-all duration-300 ease-in hover:bg-primary hover:text-text-dark dark:hover:text-text-light'
      >
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
    </div>
  );
};

CourseDescriptionCard.propTypes = {
  description: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default CourseDescriptionCard;
