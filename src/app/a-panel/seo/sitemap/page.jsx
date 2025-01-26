/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import SitemapSummary from '../../components/templates/seo/sitemap/SitemapSummary';
import SitemapContent from '../../components/templates/seo/sitemap/SitemapContent';

const SitemapPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [sitemapInfo, setSitemapInfo] = useState({});

  const fetchSitemapInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/sitemap/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setSitemapInfo(data.data);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchSitemapInfo();
  }, []);

  return (
    <div className='flex flex-col gap-8'>
      <SitemapSummary sitemapInfo={sitemapInfo} isLoading={isLoadingInfo} />
      <SitemapContent />
    </div>
  );
};

export default SitemapPage;
