'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import Button from '@/components/Ui/Button/Button';
import AddEditUserModal from '../../modules/AddEditUserModal/AddEditUserModal';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { RiFileExcel2Line } from "react-icons/ri";
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';


const HeadAction = ({ addedNewUser,  onExportExcel  }) => {
  const [searchText, setSearchText] = useState('');
  const [showNewUserModal, setShowUserModal] = useState(false);

  const showAddNewUserModal = () => {
    setShowUserModal(true);
  };
  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <SearchBox
          placeholder=' جست و جو براساس نام کاربری '
          value={searchText}
          onChange={setSearchText}
        />
        <div className='flex gap-2'>
          <OutlineButton color='green' className='px-2' onClick={ onExportExcel }>
            <RiFileExcel2Line className='text-2xl'/>
          </OutlineButton>
          <Button onClick={showAddNewUserModal} shadow>
            کاربر جدید
          </Button>
        </div>
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
  onExportExcel: PropTypes.func.isRequired,
};

export default HeadAction;
