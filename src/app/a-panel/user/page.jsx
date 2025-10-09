'use client';
import React, { useEffect, useState } from 'react';
import HeadAction from '../components/templates/user/HeadAction';
import UsersTable from '../components/templates/user/UsersTable';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import * as XLSX from 'xlsx';

const UserManagementPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleAddNewUser = (newUser) => {
    setUsers((prev) => [newUser.user, ...prev]);
  };

  const fetchUsers = async (pageNumber, q = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNumber) });
      if (q.trim()) params.set('q', q.trim());

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.meta.totalPages);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const handleDeleteUser = async (username) => {
    try {
      const response = await fetch(`/api/admin/users/${username}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.username !== username));
        toast.showSuccessToast(`کاربر ${username} با موفقیت حذف شد.`);
      } else {
        const data = await response.json();
        toast.showErrorToast(data.error || 'خطای نامشخص');
      }
    } catch {
      toast.showErrorToast('خطای غیرمنتظره');
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.username === updatedUser.username ? { ...u, ...updatedUser } : u,
      ),
    );
    toast.showSuccessToast(
      `کاربر ${updatedUser.username} با موفقیت بروزرسانی شد.`,
    );
  };

  const handlePageChange = (newPage) => setPage(newPage);

  const handleSearch = (text) => {
    setSearchQuery(text || '');
  };

  const exportToExcel = async () => {
  try {
    const res = await fetch('/api/admin/users/all');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'خطا در دریافت کاربران');
    }

    const users = data.users;

    // فقط فیلدهای دلخواه رو اکسپورت کن (مثلاً بدون رمز عبور)
    const exportData = users.map(user => ({
      نام: user.firstname,
      نام‌خانوادگی: user.lastname,
      نام‌کاربری: user.username,
      موبایل: user.phone,
      ایمیل: user.email,
      تاریخ_ثبت: new Date(user.createAt).toLocaleDateString('fa-IR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Users');
    XLSX.writeFile(workbook, 'all-users.xlsx');
  } catch (error) {
    console.error('Export error:', error);
    alert('خطا در دانلود فایل اکسل کاربران');
  }
};


  return (
    <div>
      <HeadAction addedNewUser={handleAddNewUser} onSearch={handleSearch} onExportExcel={exportToExcel}/>
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
