'use client';

import React from 'react';
import PropTypes from 'prop-types';
import DropDown from '@/components/Ui/DropDown/DropDwon';

export default function SizeSelect({
  label,
  placeholder,
  items,
  value,
  onChange,
}) {
  const options = (Array.isArray(items) ? items : []).map((s) => ({
    label: s?.slug ? `${s.name} (${s.slug})` : s.name,
    value: s.id,
  }));

  return (
    <DropDown
      label={label}
      placeholder={placeholder}
      options={options}
      value={value ?? undefined}
      onChange={(val) => onChange?.(val ? Number(val) : null)}
      fullWidth
      className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
      optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
    />
  );
}

SizeSelect.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  items: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};
