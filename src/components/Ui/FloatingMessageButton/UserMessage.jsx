/* eslint-disable react/prop-types */
import React from 'react';

const UserMessage = ({ content, className = '', time, status, avatar }) => {
  return (
    <div className={`flex w-full justify-end gap-2 ${className}`}>
      <div className="flex max-w-[78%] items-end gap-2">
        {/* Bubble */}
        <div
          className="
            group relative rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-text-light shadow
            ring-1 ring-primary/20
            transition-all
          "
        >
          {/* subtle gradient */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl rounded-br-md bg-[linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0))]" />
          <div className="relative z-[1] whitespace-pre-line break-words">
            {content}
          </div>

          {/* meta (time / status) */}
          {(time || status) && (
            <div className="relative z-[1] mt-1 flex items-center justify-end gap-1 text-[10px] text-white/80">
              {time && <span>{time}</span>}
              {status === 'sending' && <span>در حال ارسال…</span>}
              {status === 'sent' && <span>ارسال شد</span>}
              {status === 'seen' && <span>دیده شد</span>}
            </div>
          )}
        </div>

        {/* Avatar (optional) */}
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-6 w-6 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : null}
      </div>
    </div>
  );
};

export default UserMessage;