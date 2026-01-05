'use client';

import React, { useMemo, useState } from 'react';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const EMPTY_FORM = {
  section: '',
  changefreq: '',
  priority: '',
  shortAddress: '',
};

const SitemapContent = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sitemapPreview, setSitemapPreview] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ✅ مسیرهای صحیح سایت
  const sitemapCategoryOptions = useMemo(
    () => [
      { label: 'صفحه اصلی', value: '/' },

      { label: 'لیست دوره‌ها', value: '/courses' },
      { label: 'جزئیات دوره', value: '/courses/[shortAddress]' },

      { label: 'فروشگاه', value: '/shop/products' },
      { label: 'جزئیات محصول', value: '/shop/products/[slug]' },

      { label: 'مقالات', value: '/articles' },
      { label: 'جزئیات مقاله', value: '/articles/[shortAddress]' },

      { label: 'تماس با ما', value: '/contact-us' },
      { label: 'قوانین', value: '/rules' },
    ],
    []
  );

  const sitemapFrequencyOptions = [
    { label: 'روزانه', value: 'daily' },
    { label: 'هفتگی', value: 'weekly' },
    { label: 'ماهانه', value: 'monthly' },
  ];

  const sitemapPriorityOptions = [
    { label: '0.1', value: 0.1 },
    { label: '0.2', value: 0.2 },
    { label: '0.3', value: 0.3 },
    { label: '0.4', value: 0.4 },
    { label: '0.5', value: 0.5 },
    { label: '0.6', value: 0.6 },
    { label: '0.7', value: 0.7 },
    { label: '0.8', value: 0.8 },
    { label: '0.9', value: 0.9 },
    { label: '1.0', value: 1.0 },
  ];

  // ✅ تشخیص صفحات داینامیک
  const needsSlugOrShort = useMemo(() => {
    const s = String(formData.section || '');
    return s.includes('[shortAddress]') || s.includes('[slug]');
  }, [formData.section]);

  // ✅ label مناسب ورودی
  const slugLabel = useMemo(() => {
    const s = String(formData.section || '');
    return s.includes('[slug]') ? 'slug' : 'آدرس کوتاه';
  }, [formData.section]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetForm = () => {
    setFormData(EMPTY_FORM);
    toast.showSuccessToast('فرم پاک شد.');
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/seo/sitemap');
      if (response.ok) {
        const text = await response.text();
        setSitemapPreview(text);
      } else {
        toast.showErrorToast('خطا در بارگذاری پیش‌نمایش سایت‌مپ.');
      }
    } catch (error) {
      console.error('Error fetching sitemap preview:', error);
      toast.showErrorToast('خطای غیرمنتظره در بارگذاری پیش‌نمایش.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.section || !formData.changefreq || !formData.priority) {
      toast.showErrorToast('لطفاً تمامی فیلدها را پر کنید.');
      return;
    }
    if (needsSlugOrShort && !formData.shortAddress.trim()) {
      toast.showErrorToast(
        'برای صفحات جزئیات، مقدار slug/آدرس کوتاه الزامی است.'
      );
      return;
    }

    setSubmitLoading(true);
    try {
      // ✅ بک‌اند هر چی انتظار داره: هم shortAddress هم slug می‌فرستیم
      const payload = {
        section: formData.section,
        changefreq: formData.changefreq,
        priority: formData.priority,
        shortAddress: needsSlugOrShort ? formData.shortAddress.trim() : '',
        slug: needsSlugOrShort ? formData.shortAddress.trim() : '',
      };

      const response = await fetch('/api/admin/seo/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        toast.showSuccessToast('تنظیمات با موفقیت ذخیره شد.');
        setFormData(EMPTY_FORM);
      } else {
        toast.showErrorToast(
          result?.error || 'ذخیره تنظیمات با مشکل مواجه شد.'
        );
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.showErrorToast('خطا در ذخیره تنظیمات.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🔥 حذف کامل اطلاعات سایت‌مپ
  const handleDeleteAllSitemap = async () => {
    const confirmed = window.confirm(
      '⚠️ با این کار تمام اطلاعات ذخیره‌شده‌ی سایت‌مپ حذف می‌شود.\nآیا مطمئن هستید؟'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/seo/sitemap', {
        method: 'DELETE',
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        toast.showSuccessToast('تمام اطلاعات سایت‌مپ حذف شد.');
        setSitemapPreview('');
        setFormData(EMPTY_FORM);
      } else {
        toast.showErrorToast(result?.error || 'حذف سایت‌مپ ناموفق بود.');
      }
    } catch (error) {
      console.error('Error deleting sitemap:', error);
      toast.showErrorToast('خطای غیرمنتظره در حذف سایت‌مپ.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className='pb-96'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <DropDown
          fullWidth
          label='انتخاب صفحه'
          options={sitemapCategoryOptions}
          value={formData.section}
          onChange={(value) => handleChange('section', value)}
          placeholder='انتخاب صفحه مورد نظر'
        />

        {needsSlugOrShort && (
          <Input
            fullWidth
            label={slugLabel}
            placeholder={
              slugLabel === 'slug'
                ? 'مثلاً: nike-air-max'
                : 'مثلاً: react-for-beginners'
            }
            value={formData.shortAddress}
            onChange={(value) => handleChange('shortAddress', value)}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
        )}
      </div>

      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <DropDown
          fullWidth
          label='فرکانس تغییر'
          placeholder='یک گزینه انتخاب کنید'
          value={formData.changefreq}
          onChange={(value) => handleChange('changefreq', value)}
          options={sitemapFrequencyOptions}
        />

        <DropDown
          fullWidth
          label='اولویت'
          placeholder='اولویت سئو صفحه را مشخص کنید'
          value={formData.priority}
          onChange={(value) => handleChange('priority', value)}
          options={sitemapPriorityOptions}
        />
      </div>

      <div className='mt-10 flex flex-wrap gap-4 text-sm md:text-base'>
        <Button shadow onClick={handleSubmit} isLoading={submitLoading}>
          ذخیره تنظیمات
        </Button>

        <OutlineButton onClick={handlePreview} isLoading={previewLoading}>
          پیش‌نمایش نقشه سایت
        </OutlineButton>

        <OutlineButton onClick={handleResetForm}>پاک‌کردن فرم</OutlineButton>

        {/* 🔥 حذف کامل اطلاعات سایت‌مپ */}
        <OutlineButton
          onClick={handleDeleteAllSitemap}
          isLoading={deleteLoading}
        >
          حذف کامل سایت‌مپ
        </OutlineButton>
      </div>

      {sitemapPreview && (
        <div
          className='mt-8 rounded-xl border border-secondary bg-surface-light p-4 dark:bg-surface-dark'
          style={{ direction: 'ltr', textAlign: 'left' }}
        >
          <pre className='whitespace-pre-wrap text-xs sm:text-sm'>
            {sitemapPreview}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SitemapContent;
