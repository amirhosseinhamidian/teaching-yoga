/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Ui/Input/Input';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Button from '@/components/Ui/Button/Button';
import { FiInfo } from 'react-icons/fi';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import TextArea from '@/components/Ui/TextArea/TextArea';
import { FiPlus } from 'react-icons/fi';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { IoClose } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import Image from 'next/image';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { useRouter } from 'next/navigation';
import { FiEdit2 } from 'react-icons/fi';

const SeoInternalForm = ({ page }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [seoData, setSeoData] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slugUrl, setSlugUrl] = useState('');
  const [openGraphUrl, setOpenGraphUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tagList, setTagList] = useState([]);
  const [openGraphTitle, setOpenGraphTitle] = useState('');
  const [openGraphSiteName, setOpenGraphSiteName] = useState('');
  const [openGraphDescription, setOpenGraphDescription] = useState('');
  const [openGraphImageAlt, setOpenGraphImageAlt] = useState('');
  const [openGraphImageUrl, setOpenGraphImageUrl] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [canonicalTag, setCanonicalTag] = useState('');
  const [robotsTag, setRobotsTag] = useState('');
  const robotsTagOptions = [
    {
      label: 'Index, Follow (ایندکس و دنبال‌کردن لینک‌ها)',
      value: 'index, follow',
    },
    {
      label: 'Index, NoFollow (ایندکس بدون دنبال‌کردن لینک‌ها)',
      value: 'index, nofollow',
    },
    {
      label: 'NoIndex, Follow (عدم ایندکس اما دنبال‌کردن لینک‌ها)',
      value: 'noindex, follow',
    },
    {
      label: 'NoIndex, NoFollow (عدم ایندکس و عدم دنبال‌کردن لینک‌ها)',
      value: 'noindex, nofollow',
    },
  ];
  const [errorMessages, setErrorMessages] = useState({
    title: '',
    slugUrl: '',
    openGraphUrl: '',
    description: '',
    tagList: '',
    openGraphTitle: '',
    openGraphSiteName: '',
    openGraphDescription: '',
    openGraphImageAlt: '',
    openGraphImageUrl: '',
    canonicalTag: '',
    robotsTag: '',
  });

  const fileInputRef = useRef(null);

  const fetchEditData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/single?page=${page}`,
      );
      if (!response.ok) {
        throw new Error('Error to fetch edit data!');
      }
      const data = await response.json();
      setSeoData(data.data);
      setTitle(data.data.siteTitle || '');
      setOpenGraphUrl(data.data.ogUrl || '');
      setDescription(data.data.metaDescription || '');
      setTagList(
        Array.isArray(data.data.keywords)
          ? data.data.keywords.map((keyword) => keyword.replace(/^"|"$/g, '')) // اگر آرایه است، دبل کوتیشن‌ها رو از هر ایتم حذف کن
          : data.data.keywords
            ? data.data.keywords
                .split(' ، ') // جدا کردن کلمات
                .map((keyword) => keyword.replace(/^"|"$/g, '')) // حذف دبل کوتیشن‌ها از اول و آخر هر کلمه
            : [], // در غیر این صورت آرایه خالی
      );
      setOpenGraphTitle(data.data.ogTitle || '');
      setOpenGraphSiteName(data.data.ogSiteName || '');
      setOpenGraphDescription(data.data.ogDescription || '');
      setOpenGraphImageAlt(data.data.ogImageAlt || '');
      setOpenGraphImageUrl(data.data.ogImage || '');
      setSlugUrl(data.data.slug || '');
      setCanonicalTag(data.data.canonicalTag || '');
      setRobotsTag(data.data.robotsTag || '');
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در دریافت اطلاعات ');
    }
  };

  useEffect(() => {
    fetchEditData();
  }, []);

  const validateInputs = () => {
    let errors = {};
    const urlPattern =
      /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,4}(:\d+)?(\/[\w\-\\.]+)*\/?(\?[;&a-z\\[\]=\\+\-_]*\w+)?(#\w+)?$/i;

    if (!title.trim()) {
      errors.title = 'عنوان نمی‌تواند خالی باشد.';
    }

    if (!slugUrl.trim()) {
      errors.slugUrl = 'آدرس صفحه نمی‌تواند خالی باشد.';
    }

    if (canonicalTag.trim() && !urlPattern.test(canonicalTag)) {
      errors.canonicalTag = 'آدرس صفحه مرجع را به درستی وارد کنید.';
    }

    if (!robotsTag.trim()) {
      errors.robotsTag = 'یک تگ برای robots انتخاب کنید.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleSubmitChanges = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر الزامی را به درستی وارد کنید.');
      return;
    }
    try {
      const payload = {
        siteTitle: title,
        metaDescription: description,
        keywords: tagList.join(' ، '),
        ogTitle: openGraphTitle,
        ogSiteName: openGraphSiteName,
        ogDescription: openGraphDescription,
        ogUrl: openGraphUrl,
        ogImage: openGraphImageUrl,
        ogImageAlt: openGraphImageAlt,
        slug: slugUrl,
        canonicalTag,
        robotsTag,
        page: slugUrl,
      };
      setSubmitLoading(true);
      const method = seoData ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/seo/internal', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Filed to send data!');
      }
      const data = await response.json();
      setSeoData(data.data);
      toast.showSuccessToast(
        seoData
          ? 'بروزرسانی با موفقیت انجام شد.'
          : 'ثبت اطلاعات با موفقیت انجام شد.',
      );
      router.back();
    } catch (error) {
      toast.showErrorToast('خطا در ارسال اطلاعات');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddTag = () => {
    if (!tag.trim() && tag.trim().length < 3) {
      toast.showErrorToast('هر تگ حداقل باید ۳ کارکتر باشد.');
      return;
    }
    if (tagList.length === 10) {
      toast.showErrorToast('حداکثر تعداد تگ مجاز به پایان رسید.');
      return;
    }

    if (tagList.find((tagElem) => tagElem === tag.trim())) {
      setTag('');
      return;
    }
    setTagList((prev) => [...prev, tag.trim()]);
    setTag('');
  };

  const handleRemoveTag = (tagRemoved) => {
    setTagList((prev) => prev.filter((tag) => tag !== tagRemoved));
  };

  const handleImageClick = () => {
    if (!slugUrl) {
      toast.showErrorToast('ابتدا ادرس صفحه را وارد کنید.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getImageSrcWithCacheBypass = () => {
    if (!openGraphImageUrl) return '';
    return `${openGraphImageUrl}?timestamp=${new Date().getTime()}`;
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // شروع فرآیند آپلود
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', 'images/open-graph');
      formData.append(
        'fileName',
        slugUrl.replace(/^\//, '').replace(/\//g, '-'),
      );

      try {
        setImageUploadLoading(true);
        // آپلود فایل (جایگزین کنید با API خودتان)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
          {
            method: 'POST',
            body: formData,
          },
        );

        if (response.ok) {
          const imageUrl = await response.json();
          setOpenGraphImageUrl(imageUrl.fileUrl);
          toast.showSuccessToast('تصویر با موفقیت آپلود شد');
        } else {
          toast.showErrorToast.error('خطا در آپلود تصویر');
        }
      } catch (error) {
        toast.showErrorToast('خطا در آپلود:', error);
        console.error('avatar upload error: ', error);
      } finally {
        setImageUploadLoading(false);
      }
    }
  };

  return (
    <div className='pb-56'>
      <div className='flex flex-wrap items-center justify-between'>
        <PageTitle>
          {seoData ? 'ویرایش صفحه داخلی' : 'ثبت صفحه داخلی'}
        </PageTitle>
        <Button
          className='text-xs sm:text-base'
          shadow
          onClick={handleSubmitChanges}
          isLoading={submitLoading}
        >
          ذخیره تغییرات
        </Button>
      </div>
      <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2'>
          <Input
            fullWidth
            value={title}
            onChange={setTitle}
            label='عنوان صفحه'
            placeholder='عنوان صفحه را وارد کنید، مثال: آموزش یوگا برای مبتدیان'
            maxLength={60}
            isShowCounter
            errorMessage={errorMessages.title}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='عنوان صفحه (Title) یکی از مهم‌ترین فاکتورها برای سئو است و به موتورهای جستجو کمک می‌کند محتوای اصلی صفحه را شناسایی کنند. همچنین این عنوان در تب مرورگر و نتایج گوگل نمایش داده می‌شود و تأثیر مستقیم روی نرخ کلیک دارد.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        <div className='flex gap-2'>
          <Input
            fullWidth
            value={slugUrl}
            onChange={setSlugUrl}
            label='آدرس صفحه (URL Slug)'
            placeholder='آدرس کوتاه و مرتبط، مثال: yoga-for-beginners'
            isShowCounter
            fontDefault={false}
            errorMessage={errorMessages.slugUrl}
            className='bg-surface-light text-xs font-thin sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='آدرس صفحه یا URL Slug باید مختصر و خوانا باشد. این آدرس باید مطابق با آدرس صفحه باشد.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
      </div>
      <div className='mt-8 flex gap-2'>
        <TextArea
          maxLength={200}
          label='توضیحات متا'
          placeholder='توضیح مختصری درباره محتوای سایت'
          fullWidth
          errorMessage={errorMessages.description}
          value={description}
          onChange={setDescription}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Tippy
          content='توضیحات متا (Meta Description) در نتایج جستجو نمایش داده می‌شود و کاربران را برای کلیک روی لینک ترغیب می‌کند. بهتر است حاوی کلمات کلیدی اصلی باشد و حدود 150–160 کاراکتر طول داشته باشد.'
          animation='fade'
        >
          <span className='self-end'>
            <FiInfo
              size={24}
              className='text-accent transition-all duration-200 ease-in hover:scale-110'
            />
          </span>
        </Tippy>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <div className='relative w-full'>
            <Input
              maxLength={45}
              label='کلمات کلیدی صفحه'
              placeholder='کلمه کلیدی مرتبط با محتوای صفحه را وارد کنید'
              fullWidth
              isShowCounter
              value={tag}
              onChange={setTag}
              onEnterPress={handleAddTag}
              className='bg-surface-light pl-8 text-xs sm:text-sm dark:bg-surface-dark'
            />
            <ActionButtonIcon
              icon={FiPlus}
              color='accent'
              onClick={handleAddTag}
              className='absolute left-1 top-[37.5px] sm:left-1.5 sm:top-10'
            />
          </div>
          <Tippy
            content='کلیدواژه‌ها به موتورهای جستجو کمک می‌کنند تا بفهمند صفحه درباره چیست. هرچند استفاده از آن‌ها باید طبیعی باشد و تمرکز بر کیفیت محتوا اولویت دارد.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        {tagList.length !== 0 && (
          <div className='rounded-xl border border-dashed border-subtext-light px-6 pb-5 pt-3 sm:mt-4 dark:border-subtext-dark'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h4>لیست تگ ها</h4>
              <h4 className='font-faNa text-xs text-subtext-light md:text-sm dark:text-subtext-dark'>
                10/{tagList.length}
              </h4>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {tagList.map((tag, index) => (
                <div
                  key={index}
                  className='flex w-fit items-center gap-1 rounded-full bg-surface-light px-3 py-2 dark:bg-surface-dark'
                >
                  <span className='whitespace-nowrap text-xs sm:text-sm'>
                    {tag}
                  </span>
                  <IoClose
                    className='text-red md:cursor-pointer'
                    size={20}
                    onClick={() => handleRemoveTag(tag)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2'>
          <Input
            fullWidth
            value={openGraphTitle}
            onChange={setOpenGraphTitle}
            label=' عنوان اوپن گراف'
            placeholder='عنوان برای اشتراک‌گذاری در شبکه‌های اجتماعی'
            maxLength={60}
            isShowCounter
            errorMessage={errorMessages.openGraphTitle}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='عنوان اپن گراف متنی است که هنگام اشتراک‌گذاری لینک سایت شما در شبکه‌های اجتماعی نمایش داده می‌شود. این عنوان باید مختصر، جذاب و مرتبط با محتوای سایت باشد تا کاربران را به کلیک کردن ترغیب کند. '
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        <div className='flex gap-2'>
          <Input
            fullWidth
            value={openGraphSiteName}
            onChange={setOpenGraphSiteName}
            label='اسم سایت در اپن گراف'
            placeholder='اسم سایت برای اشتراک گذاری در شبکه های اجتماعی'
            maxLength={30}
            isShowCounter
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='متنی است که هنگام اشتراک‌گذاری لینک سایت شما در شبکه‌های اجتماعی، به همراه عنوان نمایش داده می‌شود. این نام باید کوتاه، مرتبط و معرف برند یا سایت شما باشد، تا به شناخت بهتر سایت توسط کاربران کمک کند. ترجیحا اسم سایت'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
      </div>

      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <Input
            fullWidth
            value={openGraphUrl}
            onChange={setOpenGraphUrl}
            errorMessage={errorMessages.openGraphUrl}
            label='آدرس صفحه برای اپن گراف'
            placeholder='URL اصلی صفحه'
            fontDefault={false}
            className='bg-surface-light text-xs font-thin sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='آدرس Open Graph به شبکه‌های اجتماعی می‌گوید که لینک اصلی صفحه چیست و کمک می‌کند اشتراک‌گذاری به‌درستی انجام شود.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        <div className='flex gap-2 self-start'>
          <TextArea
            maxLength={200}
            label='توضیحات اوپن گراف'
            placeholder='توضیحات کوتاه برای اشتراک‌گذاری در شبکه‌های اجتماعی'
            fullWidth
            value={openGraphDescription}
            onChange={setOpenGraphDescription}
            errorMessage={errorMessages.openGraphDescription}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='این توضیحات به کاربران در شبکه‌های اجتماعی کمک می‌کند تا قبل از کلیک بر روی لینک متوجه شوند صفحه درباره چیست.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <div>
            <input
              type='file'
              ref={fileInputRef}
              className='hidden'
              accept='image/*'
              onChange={handleImageChange}
            />
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              تصویر اوپن گراف
            </label>
            {openGraphImageUrl ? (
              <div onClick={handleImageClick} className='relative'>
                <Image
                  src={getImageSrcWithCacheBypass()}
                  alt='تصویر اپن گراف'
                  width={800}
                  height={600}
                  className={`h-28 w-44 rounded-xl object-cover xs:h-40 xs:w-72 md:cursor-pointer lg:h-56 lg:w-96 ${errorMessages.openGraphImageUrl ? 'border border-red' : ''}`}
                />
                <div
                  className={`absolute left-2 top-2 flex rounded-xl bg-black bg-opacity-50 p-2 md:cursor-pointer ${imageUploadLoading ? 'hidden' : ''}`}
                >
                  <FiEdit2 className='text-white' />
                </div>
                {imageUploadLoading && (
                  <div className='absolute bottom-0 left-0 right-0 top-0 flex h-full w-full items-center justify-center rounded-xl bg-black bg-opacity-25'>
                    <AiOutlineLoading3Quarters
                      size={34}
                      className='animate-spin text-secondary'
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`flex h-28 w-44 items-center justify-center rounded-xl bg-surface-light xs:h-40 xs:w-72 lg:h-56 lg:w-96 dark:bg-surface-dark ${errorMessages.openGraphImageUrl ? 'border border-red' : ''}`}
              >
                {imageUploadLoading ? (
                  <AiOutlineLoading3Quarters
                    size={34}
                    className='animate-spin text-secondary'
                  />
                ) : (
                  <div
                    className='flex h-full w-full items-center justify-center gap-2 px-4 md:cursor-pointer'
                    onClick={handleImageClick}
                  >
                    <MdOutlineAddAPhoto size={34} />
                    <p className='text-xs md:text-sm'>
                      برای افزودن تصویر کلیک کنید
                    </p>
                  </div>
                )}
              </div>
            )}
            {errorMessages.openGraphImageUrl && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.openGraphImageUrl}
              </p>
            )}
          </div>
          <Tippy
            content='تصویر OG در کنار لینک صفحه هنگام اشتراک‌گذاری نمایش داده می‌شود و تأثیر زیادی روی جذب کاربران در شبکه‌های اجتماعی دارد.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        <div className='flex gap-2 self-start'>
          <Input
            fullWidth
            value={openGraphImageAlt}
            onChange={setOpenGraphImageAlt}
            errorMessage={errorMessages.openGraphImageAlt}
            label='متن جایگزین تصویر اپن گراف'
            placeholder='توضیحی کوتاه درباره تصویر برای دسترس‌پذیری و موتورهای جستجو'
            maxLength={60}
            isShowCounter
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='متن جایگزین تصویر برای توصیف محتوای تصویر استفاده می‌شود. این متن در صورت عدم بارگذاری تصویر یا برای ابزارهای دسترس‌پذیری نمایش داده می‌شود و برای بهبود سئو نیز مفید است.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2'>
          <DropDown
            fullWidth
            value={robotsTag}
            onChange={setRobotsTag}
            options={robotsTagOptions}
            errorMessage={errorMessages.robotsTag}
            label='تگ Robots'
            placeholder='یک گزینه انتخاب کنید'
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            allowHTML={true}
            content={
              <div>
                <strrong>
                  تگ Robots به موتورهای جستجو دستور می‌دهد چگونه با این صفحه
                  رفتار کنند. تنظیمات رایج شامل موارد زیر است:
                </strrong>
                <ul>
                  <li className='py-2'>
                    Index, Follow: اجازه می‌دهد صفحه در موتورهای جستجو ایندکس
                    شود و لینک‌های موجود در آن دنبال شوند.
                  </li>
                  <li className='py-2'>
                    Index, NoFollow: صفحه ایندکس می‌شود اما لینک‌های آن دنبال
                    نمی‌شوند.
                  </li>
                  <li className='py-2'>
                    NoIndex, Follow: صفحه ایندکس نمی‌شود اما لینک‌های موجود در
                    آن دنبال می‌شوند.
                  </li>
                  <li className='py-2'>
                    NoIndex, NoFollow: صفحه ایندکس نمی‌شود و لینک‌های موجود در
                    آن هم دنبال نمی‌شوند.
                  </li>
                </ul>
                <p>
                  این تنظیمات برای کنترل نمایش صفحه در نتایج جستجو و مدیریت
                  رفتار کراولرها ضروری است.
                </p>
              </div>
            }
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
        <div className='flex gap-2'>
          <Input
            fullWidth
            value={canonicalTag}
            onChange={setCanonicalTag}
            errorMessage={errorMessages.canonicalTag}
            fontDefault={false}
            label='تگ کنونیکال (Canonical Tag)'
            placeholder='آدرس مرجع صفحه، مثال: https://example.com/yoga"'
            className='bg-surface-light text-xs font-thin sm:text-sm dark:bg-surface-dark'
          />
          <Tippy
            content='تگ کنونیکال از بروز مشکلات محتوای تکراری جلوگیری می‌کند و به موتورهای جستجو می‌گوید که آدرس اصلی صفحه چیست.'
            animation='fade'
          >
            <span className='self-end'>
              <FiInfo
                size={24}
                className='text-accent transition-all duration-200 ease-in hover:scale-110'
              />
            </span>
          </Tippy>
        </div>
      </div>
    </div>
  );
};

SeoInternalForm.propTypes = {
  page: PropTypes.string,
};

export default SeoInternalForm;
