/* eslint-disable react/prop-types */
'use client';
import React, { useEffect, useState } from 'react';
import CreateEditBlog from '../../components/modules/CreateEditBlog/CreateEditBlog';
import { useRouter, useSearchParams } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const Page = ({ params }) => {
  const { mode } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams?.get('id');
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidMode, setIsValidMode] = useState(true); // اضافه شد

  useEffect(() => {
    if (mode !== 'create' && mode !== 'edit') {
      setIsValidMode(false);
      router.replace('/not-found');
    }
  }, [mode, router]);

  useEffect(() => {
    if (mode === 'edit') {
      fetchEditData();
    }
  }, [mode]);

  const fetchEditData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/blog/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data.data);
      } else {
        toast.showErrorToast('خطا در دریافت اطلاعات');
        router.replace('/a-panel/blog');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidMode) return null; // اینجا کنترل نمایش انجام می‌شود

  return (
    <div>
      <CreateEditBlog article={article} editLoading={isLoading} />
    </div>
  );
};

export default Page;
