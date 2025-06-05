/* eslint-disable react/prop-types */
import React from 'react';

const SupportMessage = ({ content, className }) => {
  return (
    <div
      className={`mr-auto max-w-[85%] self-start rounded-md border border-blue bg-blue bg-opacity-15 p-2 text-2xs xs:text-xs md:text-sm ${className}`}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default SupportMessage;
