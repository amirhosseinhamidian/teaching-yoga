import React from 'react';
import PropTypes from 'prop-types';
import { AiOutlineInstagram } from 'react-icons/ai';
import { LiaTelegram } from 'react-icons/lia';
import { AiOutlineYoutube } from 'react-icons/ai';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';

const Socials = ({ size }) => {
  return (
    <div className='mt-6 flex items-center gap-4'>
      <IconButton icon={AiOutlineInstagram} size={size} /> {/*TODO: Add link */}
      <IconButton icon={LiaTelegram} size={size} />
      <IconButton icon={AiOutlineYoutube} size={size} />
    </div>
  );
};

Socials.propTypes = {
  size: PropTypes.number.isRequired,
};

export default Socials;
