/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import Switch from '@/components/Ui/Switch/Switch';
import Modal from '@/components/modules/Modal/Modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

import { LuTrash, LuPencil } from 'react-icons/lu';

const ProductsTable = ({ search }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTempId, setDeleteTempId] = useState(null);

  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products`
      );
      if (search) url.searchParams.set('search', search);

      const response = await fetch(url.toString(), { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        toast.showErrorToast(data?.error || 'خطا در دریافت لیست محصولات');
        setProducts([]);
        return;
      }

      // API ما شکل {items,total,...} برمی‌گردونه
      setProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleShowDeleteModal = (id) => {
    setDeleteTempId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteTempId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products/${deleteTempId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        toast.showSuccessToast(data?.message || 'محصول حذف شد.');
        setProducts((prev) => prev.filter((p) => p.id !== deleteTempId));
        setDeleteTempId(null);
        setShowDeleteModal(false);
      } else {
        toast.showErrorToast(data?.error || 'خطا در حذف محصول');
      }
    } catch (error) {
      toast.showErrorToast('خطا در ارتباط با سرور');
    }
  };

  const toggleActiveStatus = async (id, nextStatus) => {
    // optimistic update
    const prev = products;
    setProducts((p) =>
      p.map((x) => (x.id === id ? { ...x, isActive: nextStatus } : x))
    );

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/products/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !!nextStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProducts(prev);
        toast.showErrorToast(data?.error || 'خطا در تغییر وضعیت محصول');
        return;
      }

      toast.showSuccessToast(data?.message || 'وضعیت محصول بروزرسانی شد.');
    } catch (error) {
      setProducts(prev);
      toast.showErrorToast('خطا در ارتباط با سرور');
    }
  };

  const columns = [
    { key: 'id', label: 'شناسه' },
    {
      key: 'image',
      label: 'تصویر',
      minWidth: '60px',
      maxWidth: '90px',
      render: (_, row) => {
        return row.image ? (
          <Image
            src={row.image}
            alt={row.title}
            className='mx-auto rounded object-cover'
            width={96}
            height={40}
          />
        ) : (
          <span className='text-xs text-gray-500'>—</span>
        );
      },
    },
    { key: 'title', label: 'عنوان', minWidth: '120px' },
    { key: 'category', label: 'دسته بندی', minWidth: '90px' },
    {
      key: 'colors',
      label: 'رنگ‌ها',
      minWidth: '50px',
      render: (_, row) => {
        const colors = row.colors || [];
        if (!Array.isArray(colors) || colors.length === 0) {
          return (
            <span className='text-xs text-subtext-light dark:text-subtext-dark'>
              -
            </span>
          );
        }

        return (
          <div className='flex flex-wrap items-center justify-center gap-1'>
            {colors.slice(0, 8).map((c, idx) => (
              <span
                key={`${c}-${idx}`}
                className='h-3 w-3 rounded-full border border-subtext-light dark:border-subtext-dark'
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}

            {colors.length > 8 ? (
              <span className='text-xs text-subtext-light dark:text-subtext-dark'>
                +{colors.length - 8}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'price',
      label: 'قیمت',
      render: (_, row) => row.price?.toLocaleString('fa-IR'),
    },
    { key: 'stock', label: 'موجودی' },
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
            onClick={() =>
              router.push(`/a-panel/shop/products/${row.id}/update`)
            }
          />
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'فعال/غیرفعال',
      minWidth: '70px',
      render: (_, row) => (
        <Switch
          className='mt-3 justify-center'
          size='small'
          checked={!!row.isActive}
          onChange={(newStatus) => toggleActiveStatus(row.id, newStatus)}
        />
      ),
    },
  ];

  const data = products.map((p) => ({
    id: p.id,
    title: p.title,
    image: p.coverImage,
    category: p.category.title,
    price: p.price,
    stock: p.stock,
    isActive: p.isActive,
    colors: Array.isArray(p.colors)
      ? p.colors.map((x) => x?.color?.hex).filter(Boolean)
      : [],
  }));

  return (
    <div>
      <Table
        columns={columns}
        data={data}
        className='my-6 sm:my-10'
        loading={loading}
        empty={products.length === 0}
        emptyText='محصولی وجود ندارد!'
      />

      {showDeleteModal && (
        <Modal
          title='حذف محصول'
          desc='در صورت حذف محصول، دیگر به اطلاعات آن دسترسی نخواهید داشت. اگر محصول قبلاً در سفارش‌ها ثبت شده باشد، امکان حذف کامل وجود ندارد و باید آن را غیرفعال کنید. آیا مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteModal(false)}
          secondaryButtonClick={handleDeleteProduct}
        />
      )}
    </div>
  );
};

ProductsTable.propTypes = {
  search: PropTypes.string,
};

export default ProductsTable;
