import React from 'react';
import PropTypes from 'prop-types';
import { AiOutlineInstagram } from 'react-icons/ai';
import { LiaTelegram } from 'react-icons/lia';
import { AiOutlineYoutube } from 'react-icons/ai';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import Link from 'next/link';

const Socials = ({ size, socialLinks }) => {
  return (
    <div className='mt-6 flex items-center gap-4'>
      <Link href={socialLinks.instagram}>
        <IconButton icon={AiOutlineInstagram} size={size} />
      </Link>
      <Link href={socialLinks.telegram}>
        <IconButton icon={LiaTelegram} size={size} />
      </Link>
      <Link href={socialLinks.youtube}>
        <IconButton icon={AiOutlineYoutube} size={size} />
      </Link>
    </div>
  );
};

Socials.propTypes = {
  size: PropTypes.number.isRequired,
  socialLinks: PropTypes.object.isRequired,
};

export default Socials;
