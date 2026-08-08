'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import { AiOutlineInstagram, AiOutlineYoutube } from 'react-icons/ai';

import { LiaTelegram } from 'react-icons/lia';

const socialItems = [
  {
    key: 'instagram',
    label: 'اینستاگرام',
    icon: AiOutlineInstagram,
  },
  {
    key: 'telegram',
    label: 'تلگرام',
    icon: LiaTelegram,
  },
  {
    key: 'youtube',
    label: 'یوتیوب',
    icon: AiOutlineYoutube,
  },
];

const Socials = ({ size, socialLinks }) => {
  return (
    <div dir='rtl' className='mt-6 flex flex-wrap items-center gap-2'>
      {socialItems.map((item) => {
        const Icon = item.icon;

        const href = socialLinks?.[item.key] || '';

        return (
          <Link
            key={item.key}
            href={href}
            aria-label={item.label}
            className='group flex min-h-11 items-center gap-2 rounded-2xl border border-black/5 bg-surface-light/70 px-3 text-subtext-light shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/25 hover:bg-secondary/5 hover:text-secondary dark:border-white/10 dark:bg-surface-dark/65 dark:text-subtext-dark dark:hover:border-secondary/30 dark:hover:bg-secondary/10 dark:hover:text-secondary'
          >
            <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-white'>
              <Icon size={size} />
            </span>

            <span className='text-[10px] font-bold sm:text-xs'>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

Socials.propTypes = {
  size: PropTypes.number.isRequired,

  socialLinks: PropTypes.object.isRequired,
};

export default Socials;
