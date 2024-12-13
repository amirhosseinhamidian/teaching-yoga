import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { ADMIN } from '@/constants/userRole';

const HeadAction = ({ user, onDeleteUser, onUpdateUser }) => {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-wrap items-center gap-2'>
        <Image
          src={user?.avatar ? user.avatar : '/images/default-profile.png'}
          alt={user.username}
          className='rounded-full'
          width={96}
          height={96}
        />
        <div className='flex flex-col gap-1'>
          <h4>{user.username}</h4>
          <h4>
            {user?.firstname} {user?.lastname}
          </h4>
          <h4 className='font-faNa text-subtext-light dark:text-subtext-dark'>
            {user.phone}
          </h4>
          <h4 className='text-subtext-light dark:text-subtext-dark'>
            نقش: {user.role === ADMIN ? 'ادمین' : 'کاربر'}
          </h4>
        </div>
      </div>
      <div className='flex items-center justify-center gap-2'>
        <ActionButtonIcon
          color='red'
          icon={LuTrash}
          onClick={() => onDeleteUser()}
        />
        <ActionButtonIcon
          color='blue'
          icon={LuPencil}
          onClick={() => onUpdateUser()}
        />
      </div>
    </div>
  );
};

HeadAction.propTypes = {
  user: PropTypes.object.isRequired,
  onDeleteUser: PropTypes.func.isRequired,
  onUpdateUser: PropTypes.func.isRequired,
};

export default HeadAction;
