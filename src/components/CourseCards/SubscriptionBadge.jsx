/* eslint-disable react/prop-types */
import React from 'react';

export default function SubscriptionBadge({ type }) {
  // type: 'ONLY' | 'ALSO'
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold';

  if (type === 'ONLY') {
    return (
      <span className={`${base} bg-indigo-50 text-indigo-700`}>
        فقط با اشتراک
      </span>
    );
  }

  return (
    <span className={`${base} bg-emerald-50 text-emerald-700`}>
      با اشتراک هم قابل دسترسی است
    </span>
  );
}
