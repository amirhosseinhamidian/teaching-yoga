/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { FiPlus } from 'react-icons/fi';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import Switch from '@/components/Ui/Switch/Switch';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';
import FileUploadModal from '../FileUploadModal/FileUploadModal';
import { FaCircleCheck } from 'react-icons/fa6';
import { ImSpinner2 } from 'react-icons/im';
import { IoIosCloseCircle } from 'react-icons/io';

const CreateEditBlog = ({ article, editLoading }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [shortAddressStatus, setShortAddressStatus] = useState('');
  const [shortAddressError, setShortAddressError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const [title, setTitle] = useState(article?.title || '');
  const [coverLink, setCoverLink] = useState(article?.cover || '');
  const [subtitle, setSubtitle] = useState(article?.subtitle || '');
  const [shortAddress, setShortAddress] = useState(article?.shortAddress || '');
  const [readTime, setReadTime] = useState(article?.readTime || '');
  const [isActive, setIsActive] = useState(article?.isActive || false);
  const [content, setContent] = useState(article?.content || '');

  useEffect(() => {
    if (article) {
      setTitle(article?.title || '');
      setCoverLink(article?.cover || '');
      setSubtitle(article?.subtitle || '');
      setReadTime(String(article?.readTime) || '');
      setIsActive(article?.isActive || false);
      setContent(article?.content || '');
    }
  }, [article]);

  const [openUploadImageModal, setOpenUploadImageModal] = useState(false);
  const [errorMessages, setErrorMessages] = useState({
    title: '',
    coverLink: '',
    subtitle: '',
    readTime: '',
    content: '',
  });

  const handleOpenUploadCoverImageModal = () => {
    if (!title) {
      toast.showErrorToast('ابتدا عنوان مقاله را وارد کنید.');
      return;
    }
    setOpenUploadImageModal(true);
  };

  const handleCoverImageUpload = async (file) => {
    if (!file) {
      toast.showErrorToast('لطفاً یک تصویر انتخاب کنید.');
      return;
    }

    // مسیر ذخیره‌سازی دلخواه
    const folderPath = `images/article_covers/${title}`;

    // آپلود فایل
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);
    formData.append('fileName', 'cover');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.showErrorToast('خطایی رخ داده است.');
        console.error('خطا در آپلود:', errorData.error || 'خطایی رخ داده است.');
        return;
      }

      const result = await response.json();
      toast.showSuccessToast('آپلود با موفقیت انجام شد.');
      const coverUrl = String(result.fileUrl);

      setCoverLink(coverUrl);
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
      console.error('خطای غیرمنتظره در آپلود:', error.message);
    } finally {
      setOpenUploadImageModal(false);
    }
  };

  const handleShortAddressChange = (value) => {
    setShortAddress(value);

    // در صورتی که تایمر قبلاً تنظیم شده باشد، آن را پاک می‌کنیم
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // ایجاد تایمر جدید برای فراخوانی validateShortAddress پس از 1 ثانیه
    const timer = setTimeout(() => {
      validateShortAddress(value);
    }, 1000);

    setDebounceTimer(timer);
  };

  const validateShortAddress = async () => {
    if (shortAddress.length < 4) {
      setShortAddressStatus('invalid');
      setShortAddressError('آدرس باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (/\s|‌/.test(shortAddress)) {
      setShortAddressStatus('invalid');
      setShortAddressError('استفاده از فاصله یا نیم فاصله مجاز نیست.');
      return;
    }

    if (/[^a-zA-Z0-9\\-]/.test(shortAddress)) {
      setShortAddressStatus('invalid');
      setShortAddressError(
        'آدرس فقط می‌تواند شامل حروف انگلیسی، اعداد و "-" باشد.'
      );
      return;
    }

    if (!/^[a-zA-Z0-9\\-]+$/.test(shortAddress)) {
      setShortAddressStatus('invalid');
      setShortAddressError('آدرس باید فقط شامل حروف انگلیسی یا اعداد باشد.');
      return;
    }

    setShortAddressStatus('loading');
    const response = await fetch(
      `/api/admin/validate-article-short-address?shortAddress=${encodeURIComponent(shortAddress)}`
    );
    const data = await response.json();

    if (data.isValid) {
      setShortAddressStatus('valid');
      setShortAddressError('');
    } else {
      setShortAddressStatus('invalid');
      setShortAddressError(data.message);
    }
  };

  const validateInputs = () => {
    let errors = {};

    if (!title.trim()) {
      errors.title = 'عنوان نمی‌تواند خالی باشد.';
    } else if (title.trim().length < 3) {
      errors.title = 'عنوان نمی‌تواند کمتر از سه کارکتر باشد.';
    }

    if (!subtitle.trim()) {
      errors.subtitle = 'توضیح کوتاه نمی‌تواند خالی باشد.';
    } else if (subtitle.trim().length < 10) {
      errors.subtitle = 'توضیح کوتاه نمی‌تواند کمتر از ۱۰ کارکتر باشد.';
    }

    if (!coverLink.trim()) {
      errors.coverLink = 'کاور را انتخاب کنید';
    }

    if (!readTime.trim()) {
      errors.readTime = 'زمان تقریبی مطالعه را وارد کنید.';
    }

    if (!content.replace(/<[^>]*>/g, '').trim()) {
      errors.content = 'محتوا نمی تواند خالی باشد.';
    } else if (content.replace(/<[^>]*>/g, '').trim().length < 100) {
      errors.content = 'محتوا نمی تواند کمتر از ۱۰۰ کارکتر باشد.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }
    const payload = {
      title,
      content,
      cover: coverLink,
      readTime: Number(readTime),
      shortAddress,
      subtitle,
      isActive,
    };

    const method = article ? 'PUT' : 'POST';
    const url = article
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/blog/${article.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/blog`;
    try {
      setIsLoading(true);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast.showSuccessToast(
          article ? 'مقاله با موفقیت ویرایش شد.' : 'مقاله با موفقیت ساخته شد'
        );
        router.replace('/a-panel/blog');
      } else {
        toast.showErrorToast('خطای رخ داده');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {editLoading ? (
        <div>در حال دریافت اطلاعات ...</div>
      ) : (
        <>
          <div>
            <div
              className={`flex flex-wrap items-center justify-between gap-2`}
            >
              <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
                {article ? 'ویرایش مقاله' : 'ثبت مقاله جدید'}
              </h1>
              <Button
                onClick={handleSubmitForm}
                shadow
                isLoading={isLoading}
                className='flex items-center justify-center text-xs sm:text-sm md:text-base'
              >
                {article ? 'ویرایش' : 'ثبت'}
              </Button>
            </div>
            <div className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <Input
                label='عنوان مقاله'
                placeholder='عنوان دوره را وارد کنید'
                value={title}
                onChange={setTitle}
                errorMessage={errorMessages.title}
                className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
              />
              <div className='relative'>
                <Input
                  label='لینک کاور'
                  placeholder='لینک کاور مقاله را وارد کنید'
                  value={coverLink}
                  onChange={setCoverLink}
                  errorMessage={errorMessages.coverLink}
                  className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
                />
                <ActionButtonIcon
                  icon={FiPlus}
                  color='accent'
                  className='absolute left-1.5 top-[39px]'
                  onClick={handleOpenUploadCoverImageModal}
                />
              </div>
            </div>
            <div className='mt-10'>
              <Input
                label='توضیح کوتاه'
                placeholder='توضیح کوتاهی بنویسید'
                value={subtitle}
                onChange={setSubtitle}
                errorMessage={errorMessages.subtitle}
                maxLength={120}
                isShowCounter
                className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
              />
            </div>
            <div className='mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
              {!article && (
                <div className='relative'>
                  <Input
                    label='لینک کوتاه'
                    placeholder='لینک کوتاه را به انگلیسی وارد کنید'
                    value={shortAddress}
                    onChange={handleShortAddressChange}
                    errorMessage={
                      shortAddressError || errorMessages.shortAddress
                    }
                    className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
                  />
                  <div>
                    {shortAddressStatus === 'loading' && (
                      <ImSpinner2
                        size={20}
                        className='absolute left-2 top-11 animate-spin text-subtext-light dark:text-subtext-dark'
                      />
                    )}
                    {shortAddressStatus === 'valid' && (
                      <FaCircleCheck
                        size={20}
                        className='text-green-light dark:text-green-dark absolute left-2 top-11'
                      />
                    )}
                    {shortAddressStatus === 'invalid' && (
                      <IoIosCloseCircle
                        size={20}
                        className='absolute left-2 top-11 text-red'
                      />
                    )}
                  </div>
                </div>
              )}
              <Input
                label='زمان مطالعه (دقیقه)'
                placeholder='زمان حدود مطالعه را برحسب دقیقه وارد کنید'
                value={readTime}
                onChange={setReadTime}
                errorMessage={errorMessages.readTime}
                type='number'
                className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
              />
            </div>
            <div className='mt-10'>
              <Switch
                label='آیا مقاله از همین لحظه فعال باشد؟'
                checked={isActive}
                onChange={setIsActive}
                className='mr-3 h-full flex-row gap-3'
                size='small'
              />
            </div>
            <div className='mt-10'>
              <TextEditor
                label='محتوای مقاله'
                value={content}
                onChange={setContent}
                errorMessage={errorMessages.content}
                placeholder='محتوای مقاله را در اینجا وارد کنید'
                className='bg-surface-light dark:bg-surface-dark'
              />
            </div>
            {openUploadImageModal && (
              <FileUploadModal
                title='آپلود کاور مقاله'
                desc='برای آپلود تصویر کاور مقاله فایل خود را در اینجا بکشید و رها کنید یا کلیک و انتخاب کنید.'
                onUpload={handleCoverImageUpload}
                onClose={() => setOpenUploadImageModal(false)}
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

CreateEditBlog.propTypes = {
  article: PropTypes.object,
  editLoading: PropTypes.bool,
};

export default CreateEditBlog;
