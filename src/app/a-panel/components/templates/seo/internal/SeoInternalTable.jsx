'use client';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import Table from '@/components/Ui/Table/Table';
import React, { useEffect, useState } from 'react';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Modal from '@/components/modules/Modal/Modal';

const SeoInternalTable = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTempPage, setDeleteTempPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seoData, setSeoData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo/internal');
      if (!response.ok) {
        throw new Error('Error to fetch seo internal data!');
      }
      const data = await response.json();
      setSeoData(data.data);
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShowDeleteModal = (page) => {
    setDeleteTempPage(page);
    setShowDeleteModal(true);
  };

  const handleDeleteSeoData = async () => {
    try {
      toast.showLoadingToast('در حال پاک کردن اطلاعات', { duration: 1500 });
      const response = await fetch(
        `/api/admin/seo/internal?page=${deleteTempPage}`,
        {
          method: 'DELETE',
        },
      );
      if (!response.ok) {
        throw new Error('Error to Delete seo infos!');
      }
      setSeoData((prev) =>
        prev.filter((seoData) => seoData.page !== deleteTempPage),
      );
      toast.showSuccessToast('اطلاعات با موفقیت حذف شد.');
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در حذف اطلاعات سئو');
    } finally {
      setShowDeleteModal(false);
      setDeleteTempPage(null);
    }
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    { key: 'siteTitle', label: 'عنوان صفحه', minWidth: '150px' },
    {
      key: 'index',
      minWidth: '100px',
      label: 'قابلیت نمایش در گوگل',
      render: (index) => {
        const indexMap = {
          false: {
            label: 'خیر',
            bg: 'bg-red',
            text: 'text-red whitespace-nowrap',
          },
          true: {
            label: 'بله',
            bg: 'bg-green',
            text: 'text-green dark:text-accent whitespace-nowrap',
          },
        };
        const indexStyle = indexMap[index] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600 whitespace-nowrap',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              indexStyle.bg,
              indexStyle.text,
            )}
          >
            {indexStyle.label}
          </span>
        );
      },
    },
    {
      key: 'follow',
      minWidth: '100px',
      label: 'قابلیت دنبال شدن توسط موتور جستجو',
      render: (follow) => {
        const followMap = {
          false: {
            label: 'خیر',
            bg: 'bg-red',
            text: 'text-red whitespace-nowrap',
          },
          true: {
            label: 'بله',
            bg: 'bg-green',
            text: 'text-green dark:text-accent whitespace-nowrap',
          },
        };
        const followStyle = followMap[follow] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600 whitespace-nowrap',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              followStyle.bg,
              followStyle.text,
            )}
          >
            {followStyle.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleShowDeleteModal(row.page)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() =>
              router.push(
                `/a-panel/seo/internal/edit/${encodeURIComponent(row.page)}`,
              )
            }
          />
        </div>
      ),
    },
  ];

  // داده‌ها برای جدول (در اینجا از داده‌های API استفاده می‌کنیم)
  const data = seoData.map((seo, index) => ({
    number: index + 1,
    id: seo?.values.id,
    siteTitle: seo?.values?.siteTitle,
    metaDescription: seo?.values?.metaDescription,
    keywords: seo?.values?.keywords,
    ogTitle: seo?.values?.ogTitle,
    ogSiteName: seo?.values?.ogSiteName,
    ogDescription: seo?.values?.ogDescription,
    ogUrl: seo?.values?.ogUrl,
    ogImage: seo?.values?.ogImage,
    ogImageAlt: seo?.values?.ogImageAlt,
    slug: seo?.values?.slug,
    canonicalTag: seo?.values?.canonicalTag,
    robotsTag: seo?.values?.robotsTag,
    index: seo?.values?.robotsTag.split(',')[0].trim() === 'index',
    follow: seo?.values?.robotsTag.split(',')[1].trim() === 'follow',
    page: seo?.page,
  }));

  return (
    <div>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={loading}
        empty={seoData.length === 0}
        emptyText='تنظیماتی برای صفحات ثبت نشده است.'
      />
      {showDeleteModal && (
        <Modal
          title='حذف اطلاعات سئو'
          desc='با حذف اطلاعات سئو این صفحه دسترسی به آن امکان پذیر نیست و سئو این صفحه بر اساس اطلاعات سئو کلی خواهد بود. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteModal(false)}
          secondaryButtonClick={handleDeleteSeoData}
        />
      )}
    </div>
  );
};

export default SeoInternalTable;
