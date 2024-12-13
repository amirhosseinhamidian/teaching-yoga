/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import HeadAction from '../../components/templates/userDetail/HeadAction';
import { useParams, useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { ImSpinner2 } from 'react-icons/im';
import Modal from '@/components/modules/Modal/Modal';
import { LuTrash } from 'react-icons/lu';
import AddCourseSection from '../../components/templates/userDetail/AddCourseSection';
import AddEditUserModal from '../../components/modules/AddEditUserModal/AddEditUserModal';

const DetailUserPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  let { username } = params;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}`,
      );
      if (!response.ok) {
        toast.showErrorToast('کاربر پیدا نشد');
      }
      const data = await response.json();
      setUser(data); //ذخیره اطلاعات کاربر
    } catch (err) {
      toast.showErrorToast(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    fetchUserData();
  }, [username]);

  const handleShowDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}`,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        toast.showSuccessToast(`کاربر ${username} با موفقیت حذف شد.`);
        router.replace('/a-panel/user');
      } else {
        const data = await response.json();
        toast.showErrorToast(data.error || 'خطای نامشخص');
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره');
    }
  };

  const handleShowEditModal = () => {
    setShowUpdateModal(true);
  };

  return (
    <div>
      {isLoading ? (
        <div>
          <ImSpinner2
            size={36}
            className='mx-auto mt-16 animate-spin text-primary'
          />
        </div>
      ) : (
        <div>
          <HeadAction
            user={user}
            onDeleteUser={handleShowDeleteModal}
            onUpdateUser={handleShowEditModal}
          />
          <AddCourseSection userId={user.id} className='mt-8 sm:mt-12' />
        </div>
      )}

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
          }}
          secondaryButtonClick={() => {
            deleteUser();
            setShowDeleteModal(false);
          }}
        />
      )}

      {showUpdateModal && (
        <AddEditUserModal
          onClose={() => {
            setShowUpdateModal(false);
          }}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setShowUpdateModal(false);
          }}
          editUser={user}
        />
      )}
    </div>
  );
};

export default DetailUserPage;
