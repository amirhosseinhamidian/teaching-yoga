import React from 'react';
import Button from '../Ui/Button/Button';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { BiCartAdd } from 'react-icons/bi';
import PropTypes from 'prop-types';

export default function CardActions({ mainBtnClick, subBtnClick, className }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Button
        onClick={mainBtnClick}
        shadow
        className='w-full text-xs sm:text-sm md:text-base'
      >
        مشاهده جزییات
      </Button>
      <IconButton icon={BiCartAdd} onClick={subBtnClick} size={28} />
    </div>
  );
}

CardActions.propTypes = {
  mainBtnClick: PropTypes.func,
  subBtnClick: PropTypes.func,
  className: PropTypes.string,
};
