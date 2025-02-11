/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import { useRouter } from 'next/navigation';
import Switch from '@/components/Ui/Switch/Switch';

const ArticleTable = ({
  className,
  articles,
  setArticles,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [articleTempId, setArticleTempId] = useState(null);
  const [showArticleDeleteModal, setShowArticleDeleteModal] = useState(false);

  const handleDeleteArticleModal = (id) => {
    setArticleTempId(id);
    setShowArticleDeleteModal(true);
  };

  const handleDeleteArticle = async () => {
    try {
      toast.showLoadingToast('در حال حذف مقاله');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/blog/${articleTempId}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setArticles(articles.filter((article) => article.id !== articleTempId));
        setArticleTempId(null);
        setShowArticleDeleteModal(false);
      } else {
        toast.showErrorToast(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleActiveStatus = async (id, row, currentStatus) => {
    row.isActive = !row.isActive;
    try {
      // به‌روزرسانی Optimistic
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id ? { ...article, isActive: currentStatus } : article,
        ),
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/blog/${id}/active-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: currentStatus }), // ارسال مقدار جدید
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating isActive:', error);
      // بازگرداندن به حالت قبلی در صورت خطا
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id ? { ...article, isActive: currentStatus } : article,
        ),
      );
    }
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'cover',
      label: 'تصویر شاخص',
      minWidth: '70px',
      maxWidth: '90px',
      render: (_, row) => (
        <Image
          src={row.cover}
          alt={row.title}
          className='rounded object-cover'
          width={96}
          height={56}
        />
      ),
    },
    { key: 'title', label: 'عنوان', minWidth: '150px' },
    {
      key: 'visitCount',
      label: 'بازدید',
    },
    {
      key: 'commentCount',
      label: 'تعداد نظرات',
      minWidth: '70px',
    },
    {
      key: 'createAt',
      label: 'تاریخ انتشار',
      render: (date) => getShamsiDate(date),
    },
    {
      key: 'updatedAt',
      label: 'آخرین ویرایش',
      render: (date) => getShamsiDate(date),
    },
    {
      key: 'actions',
      label: 'عملیات',
      // eslint-disable-next-line no-unused-vars
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleDeleteArticleModal(row.id)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => {
              router.push(`/a-panel/blog/edit?id=${row.id}`);
            }}
          />
        </div>
      ),
    },
    {
      key: 'active',
      label: 'فعال/غیر فعال',
      minWidth: '100px',
      render: (_, row) => (
        <Switch
          className='mt-3 justify-center'
          size='small'
          checked={row.isActive} // استفاده از مقدار activeStatus از داده‌ها
          onChange={(newStatus) => toggleActiveStatus(row.id, row, newStatus)}
        />
      ),
    },
  ];

  const data = articles?.map((article, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: article.id,
    commentCount: article.comments?.length || 0,
    comments: article.comments,
    cover: article.cover,
    title: article.title,
    isActive: article.isActive,
    createAt: article.createAt,
    updatedAt: article.updatedAt,
    visitCount: article?.visitCount || 0,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={articles?.length === 0}
        emptyText='هیچ مقاله ای وجود ندارد.'
      />
      {articles?.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showArticleDeleteModal && (
        <Modal
          title='حذف مقاله'
          desc='با حذف مقاله دیگر دسترسی به آن وجود نخواهد داشت. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setArticleTempId(null);
            setShowArticleDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteArticle}
        />
      )}
    </div>
  );
};

ArticleTable.propTypes = {
  className: PropTypes.string,
  articles: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setArticles: PropTypes.func.isRequired,
};

export default ArticleTable;
