/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import HeadAction from '../components/templates/user/HeadAction';
import UsersTable from '../components/templates/user/UsersTable';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const UserManagementPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Function to add a new user
  const handleAddNewUser = (newUser) => {
    setUsers((prevUsers) => [newUser.user, ...prevUsers]);
  };

  // Fetch users based on the page number
  const fetchUsers = async (page) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users?page=${page}`,
      );
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.meta.totalPages);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  // Handle deleting a user
  const handleDeleteUser = async (username) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${username}`,
        {
          method: 'DELETE',
        },
      );

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user.username !== username),
        );
        toast.showSuccessToast(`کاربر ${username} با موفقیت حذف شد.`);
      } else {
        const data = await response.json();
        toast.showErrorToast(data.error || 'خطای نامشخص');
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره');
    }
  };

  // Handle updating a user
  const handleUpdateUser = (updatedUser) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.username === updatedUser.username
          ? {
              ...user,
              username: updatedUser.username || user.username,
              phone: updatedUser.phone || user.phone,
              firstname: updatedUser.firstname || user.firstname,
              lastname: updatedUser.lastname || user.lastname,
              role: updatedUser.role || user.role,
            }
          : user,
      ),
    );
    toast.showSuccessToast(
      `کاربر ${updatedUser.username} با موفقیت بروزرسانی شد.`,
    );
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      <HeadAction addedNewUser={handleAddNewUser} />
      <UsersTable
        className='mt-6'
        users={users}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onDeleteUser={handleDeleteUser}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
};

export default UserManagementPage;
