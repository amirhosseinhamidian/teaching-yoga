'use client';
import React, { useEffect, useState } from 'react';
import CreateEditBlog from '../../components/modules/CreateEditBlog/CreateEditBlog';
import { useRouter, useSearchParams } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const page = ({ params }) => {
  const { mode } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams?.get('id');
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (mode !== 'create' && mode !== 'edit') {
    router.replace('/not-found');
    return;
  }

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

  useEffect(() => {
    if (mode === 'edit') {
      fetchEditData();
    }
  }, [mode]);

  return (
    <div>
      <CreateEditBlog article={article} editLoading={isLoading} />
    </div>
  );
};

export default page;
