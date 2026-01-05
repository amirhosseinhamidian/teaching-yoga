/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import CategoryFormModal from '../../components/templates/shop/categories/CategoryFormModal';
import HeadActionCategories from '../../components/templates/shop/categories/HeadActionCategories';
import CategoriesTable from '../../components/templates/shop/categories/CategoriesTable';

export default function AdminShopCategoriesPage() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [search, setSearch] = useState('');

  // لیست خام دسته‌بندی‌ها برای parent dropdown
  const [allCategories, setAllCategories] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  // modal states
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // create | edit
  const [editItem, setEditItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => setRefreshKey((x) => x + 1);

  const fetchAllCategories = async () => {
    try {
      setAllLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (!res.ok) {
        setAllCategories([]);
        toast.showErrorToast(data?.error || 'خطا در دریافت دسته‌بندی‌ها');
        return;
      }

      setAllCategories(data?.items || []);
    } catch (e) {
      setAllCategories([]);
      toast.showErrorToast('خطا در دریافت اطلاعات');
    } finally {
      setAllLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleCreateClick = () => {
    setFormMode('create');
    setEditItem(null);
    setOpenForm(true);
  };

  const handleEditClick = (rowRaw) => {
    setFormMode('edit');
    setEditItem({
      id: rowRaw.id,
      title: rowRaw.title,
      slug: rowRaw.slug,
      parentId: rowRaw.parentId,
    });
    setOpenForm(true);
  };

  const handleSuccess = async () => {
    // بعد از create/update، لیست parentها آپدیت بشه
    await fetchAllCategories();
    // خود جدول هم باید رفرش بشه -> ساده‌ترین: با یک key یا state
    // اینجا فقط از CategoriesTable می‌خوایم یک callback برای refresh بگیره
    bumpRefresh();
  };

  return (
    <div>
      <HeadActionCategories
        onCreateClick={handleCreateClick}
        onSearch={(q) => setSearch(q)}
      />

      <CategoriesTable
        search={search}
        onEditClick={handleEditClick}
        refreshKey={refreshKey}
        onAfterDelete={() => {
          fetchAllCategories();
          bumpRefresh();
        }}
      />

      <CategoryFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        mode={formMode}
        initialData={editItem}
        allCategories={allCategories}
        onSuccess={handleSuccess}
        isLoadingParents={allLoading}
      />
    </div>
  );
}
