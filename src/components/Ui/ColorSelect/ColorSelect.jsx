'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function normalizeHex(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  return s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;
}
function isValidHex(hex) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

export default function ColorSelect({
  label,
  placeholder = 'انتخاب کنید',
  items,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const selected = useMemo(() => {
    const id = value == null ? null : Number(value);
    if (!Number.isFinite(id)) return null;
    return items.find((x) => x.id === id) || null;
  }, [items, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const t = e.target;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className='relative'>
      {label ? (
        <label className='mb-2 block text-xs font-medium text-subtext-light dark:text-subtext-dark'>
          {label}
        </label>
      ) : null}

      <button
        ref={btnRef}
        type='button'
        onClick={() => setOpen((p) => !p)}
        className='flex w-full items-center justify-between rounded-xl border border-accent bg-surface-light px-3 py-2 text-sm dark:bg-surface-dark'
      >
        <div className='flex items-center gap-2'>
          {selected ? (
            <>
              <span
                className='h-3 w-3 rounded-full border border-subtext-light dark:border-subtext-dark'
                style={{
                  backgroundColor: isValidHex(normalizeHex(selected.hex))
                    ? normalizeHex(selected.hex)
                    : '#000',
                }}
              />
              <span className='text-text-light dark:text-text-dark'>
                {selected.name}
              </span>
            </>
          ) : (
            <span className='text-subtext-light dark:text-subtext-dark'>
              {placeholder}
            </span>
          )}
        </div>

        <span className='text-subtext-light dark:text-subtext-dark'>▾</span>
      </button>

      {open && (
        <div
          ref={popRef}
          className='absolute right-0 z-[60] mt-2 max-h-64 w-full overflow-auto rounded-xl border border-subtext-light bg-surface-light p-2 shadow-lg dark:border-subtext-dark dark:bg-surface-dark'
        >
          {items.length === 0 ? (
            <p className='p-2 text-xs text-subtext-light dark:text-subtext-dark'>
              موردی وجود ندارد.
            </p>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                type='button'
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className='flex w-full items-center gap-2 rounded-lg px-2 py-2 text-right text-sm hover:bg-foreground-light dark:hover:bg-foreground-dark'
              >
                <span
                  className='h-3 w-3 rounded-full border border-subtext-light dark:border-subtext-dark'
                  style={{
                    backgroundColor: isValidHex(normalizeHex(c.hex))
                      ? normalizeHex(c.hex)
                      : '#000',
                  }}
                  title={c.hex}
                />
                <span className='text-text-light dark:text-text-dark'>
                  {c.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

ColorSelect.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      hex: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
};
