'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import Button from '@/components/Ui/Button/Button';
import AddEditUserModal from '../../modules/AddEditUserModal/AddEditUserModal';

const HeadAction = ({ addedNewUser, onSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [showNewUserModal, setShowUserModal] = useState(false);

  const showAddNewUserModal = () => {
    setShowUserModal(true);
  };
  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SearchBox
          placeholder='نام کاربری یا شماره موبایل'
          value={searchText}
          onChange={setSearchText}
          onSearch={() => onSearch?.(searchText)}
        />
        <Button onClick={showAddNewUserModal} shadow>
          ثبت کاربر جدید
        </Button>
      </div>
      {showNewUserModal && (
        // add modal
        <AddEditUserModal
          onClose={() => setShowUserModal(false)}
          onSuccess={(newUser) => {
            addedNewUser(newUser);
            setShowUserModal(false);
          }}
        />
      )}
    </>
  );
};

HeadAction.propTypes = {
  addedNewUser: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
};

export default HeadAction;
