/* eslint-disable react/prop-types */
import React from 'react';

const SupportMessage = ({ content, className = '', time }) => {
  return (
    <div className={`flex w-full justify-start gap-2 ${className}`}>

      <div className="max-w-[78%]">
        <div
          className="
            relative rounded-2xl rounded-bl-md bg-gray-100 px-3 py-2 text-sm text-gray-800 shadow
            ring-1 ring-black/5
            dark:bg-white/10 dark:text-gray-100 dark:ring-white/10
          "
        >
          {/* subtle highlight strip */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl rounded-bl-md bg-[linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0))]" />
          <div
            className="relative z-[1] whitespace-pre-line break-words prose prose-sm max-w-none
                       prose-p:my-1 prose-ul:my-1 prose-li:my-0.5
                       dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
          />
          {time && (
            <div className="relative z-[1] mt-1 text-[10px] text-gray-500 dark:text-gray-400">
              {time}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportMessage;