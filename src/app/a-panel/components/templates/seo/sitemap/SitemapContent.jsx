'use client';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import React, { useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Ui/Input/Input';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

const SitemapContent = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sitemapPreview, setSitemapPreview] = useState('');
  const [formData, setFormData] = useState({
    sitemapCategory: '',
    frequency: '',
    priority: '',
    shortAddress: '',
  });

  const sitemapCategoryOptions = [
    { label: 'صفحه اصلی', value: 'home' },
    { label: 'لیست دوره‌ها', value: 'courses' },
    { label: 'جزئیات دوره', value: 'course' },
    { label: 'مقالات', value: 'articles' },
    { label: 'جزئیات مقاله', value: 'article' },
    { label: 'تماس با ما', value: 'contact-us' },
    { label: 'قوانین', value: 'rules' },
  ];
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

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/admin/seo/sitemap');
      if (response.ok) {
        const text = await response.text();
        setSitemapPreview(text); // ذخیره پیش‌نمایش سایت‌مپ
      } else {
        toast.showErrorToast('خطا در بارگذاری پیش‌نمایش سایت‌ مپ.');
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
    setSubmitLoading(true);
    try {
      const response = await fetch('/api/admin/seo/sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.showSuccessToast('تنظیمات با موفقیت ذخیره شد.');
        setFormData({ sitemapCategory: '', frequency: '', priority: '' }); // ریست فرم
      } else {
        toast.showErrorToast('ذخیره تنظیمات با مشکل مواجه شد.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.showErrorToast('خطا در ذخیره تنظیمات.');
    } finally {
      setSubmitLoading(false);
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
        {(formData.section === 'article' || formData.section === 'course') && (
          <Input
            fullWidth
            label='آدرس کوتاه'
            placeholder='آدرس کوتاه صفحه را وارد کنید'
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
          placeholder='یک گزینه برای بازه تغییرات انتخاب کنید'
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
          پیش نمایش نقشه سایت
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
