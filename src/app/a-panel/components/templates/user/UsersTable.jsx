'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { LuUserCog } from 'react-icons/lu';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Modal from '@/components/modules/Modal/Modal';
import AddEditUserModal from '../../modules/AddEditUserModal/AddEditUserModal';

const UsersTable = ({
  className,
  users,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onDeleteUser,
  onUpdateUser,
}) => {
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [tempUser, setTempUser] = useState({});

  const handleShowDeleteModal = (id) => {
    setTempUsername(id);
    setShowDeleteModal(true);
  };

  const handleShowUpdateModal = (user) => {
    setTempUser(user);
    setShowUpdateModal(true);
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'username',
      label: 'نام کاربری',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-1 px-2'>
          <Image
            src={row?.avatar || '/images/default-profile.png'}
            alt={row.username}
            className='h-8 w-8 rounded-full object-cover'
            width={64}
            height={64}
          />
          <p>{row.username}</p>
        </div>
      ),
    },
    {
      key: 'fullname',
      label: 'نام و نام خانوادگی',
      minWidth: '100px',
      render: (_, row) => (
        <span>
          {row?.firstname} {row?.lastname}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'شماره موبایل',
      render: (_, row) => <span className='font-faNa'>{row.phone}</span>,
    },
    {
      key: 'role',
      label: 'نقش کاربر',
      render: (_, row) => (
        <span>{row.role === 'ADMIN' ? 'ادمین' : 'کاربر'}</span>
      ),
    },
    {
      key: 'courses',
      label: 'تعداد دوره ها',
      render: (_, row) => <span>{row.courses ? row.courses.length : '0'}</span>,
    },
    {
      key: 'actions',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleShowDeleteModal(row.id)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => handleShowUpdateModal(row)}
          />
          <ActionButtonIcon
            color='accent'
            icon={LuUserCog}
            onClick={() => router.push(`/a-panel/user/${row.id}`)}
          />
        </div>
      ),
    },
  ];

  const data = users.map((user, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: user.id,
    username: user.username,
    phone: user?.phone,
    firstname: user.firstname,
    lastname: user.lastname,
    avatar: user.avatar,
    role: user.role,
    courses: user.courses,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={isLoading}
      />
      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        totalPages={totalPages}
      />

      {showDeleteModal && (
        <Modal
          title='حذف کاربر'
          icon={LuTrash}
          iconColor='red'
          iconSize={32}
          desc='با حذف کاربر تمام اطلاعات او از سیستم حذف می شود و قابل بازیابی نیست. آیا از حذف مطمئن هستید؟'
          primaryButtonText='لغو'
          secondaryButtonText='حذف'
          primaryButtonClick={() => {
            setShowDeleteModal(false);
            setTempUsername('');
          }}
          secondaryButtonClick={() => {
            onDeleteUser(tempUsername);
            setShowDeleteModal(false);
          }}
        />
      )}

      {showUpdateModal && (
        <AddEditUserModal
          onClose={() => {
            setShowUpdateModal(false);
            setTempUser({});
          }}
          onSuccess={(updatedUser) => {
            onUpdateUser(updatedUser);
            setShowUpdateModal(false);
          }}
          editUser={tempUser}
        />
      )}
    </div>
  );
};

UsersTable.propTypes = {
  className: PropTypes.string,
  users: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onDeleteUser: PropTypes.func.isRequired,
  onUpdateUser: PropTypes.func.isRequired,
};

export default UsersTable;
