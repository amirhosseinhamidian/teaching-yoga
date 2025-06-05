/* eslint-disable react/prop-types */
import React from 'react';

const UserMessage = ({ content, className }) => {
  return (
    <div
      className={`ml-auto max-w-[85%] self-end rounded-md border border-primary bg-primary bg-opacity-15 p-2 text-2xs xs:text-xs md:text-sm ${className}`}
    >
      {content}
    </div>
  );
};

export default UserMessage;
