/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import Table from '@/components/Ui/Table/Table';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import PropTypes from 'prop-types';

const CategoriesTable = ({
  search,
  refreshKey,
  onEditClick,
  onAfterDelete,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTempId, setDeleteTempId] = useState(null);

  const [openEdit, setOpenEdit] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories`
      );
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در دریافت دسته‌بندی‌ها');
        setItems([]);
        return;
      }

      setItems(data?.items || []);
    } catch (e) {
      toast.showErrorToast('خطا در دریافت اطلاعات');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [refreshKey, search]);

  const handleShowDeleteModal = (id) => {
    setDeleteTempId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories/${deleteTempId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در حذف دسته‌بندی');
        return;
      }

      toast.showSuccessToast(data?.message || 'دسته‌بندی حذف شد.');
      setItems((prev) => prev.filter((x) => x.id !== deleteTempId));
      setDeleteTempId(null);
      setShowDeleteModal(false);

      onAfterDelete && onAfterDelete();
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره');
    }
  };

  const columns = [
    { key: 'id', label: 'شناسه' },
    { key: 'title', label: 'عنوان', minWidth: '160px' },
    { key: 'slug', label: 'اسلاگ', minWidth: '160px' },
    {
      key: 'parent',
      label: 'والد',
      render: (_, row) => row.parentTitle || '-',
    },
    {
      key: 'productsCount',
      label: 'تعداد محصول',
      render: (_, row) => row.productsCount ?? 0,
    },
    {
      key: 'childrenCount',
      label: 'زیرمجموعه‌ها',
      render: (_, row) => row.childrenCount ?? 0,
    },
    {
      key: 'actions',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => onEditClick && onEditClick(row.raw)}
          />
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleShowDeleteModal(row.id)}
          />
        </div>
      ),
    },
  ];

  const data = items.map((x) => ({
    id: x.id,
    title: x.title,
    slug: x.slug,
    parentTitle: x.parent?.title,
    productsCount: x._count?.products || 0,
    childrenCount: x.children?.length || 0,
    raw: x,
  }));

  return (
    <div className='mt-6'>
      <Table
        columns={columns}
        data={data}
        className='my-6 sm:my-10'
        loading={loading}
        empty={items.length === 0}
        emptyText='دسته‌بندی‌ای وجود ندارد!'
      />

      {showDeleteModal && (
        <Modal
          title='حذف دسته‌بندی'
          desc='اگر این دسته‌بندی دارای محصول یا زیرمجموعه باشد قابل حذف نیست. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteModal(false)}
          secondaryButtonClick={handleDelete}
        />
      )}

      {/* اینجا بعداً فرم ساخت/ویرایش را می‌گذاریم (مودال یا صفحه جدا) */}
      {openEdit && (
        <Modal
          title='ویرایش دسته‌بندی'
          desc='(فعلاً) فرم ویرایش را در مرحله بعد اضافه می‌کنیم.'
          icon={LuPencil}
          primaryButtonText='بستن'
          secondaryButtonText='باشه'
          primaryButtonClick={() => setOpenEdit(false)}
          secondaryButtonClick={() => setOpenEdit(false)}
        />
      )}
    </div>
  );
};

CategoriesTable.propTypes = {
  search: PropTypes.string,
  onEditClick: PropTypes.func,
  onAfterDelete: PropTypes.func,
  refreshKey: PropTypes.number,
};

export default CategoriesTable;
