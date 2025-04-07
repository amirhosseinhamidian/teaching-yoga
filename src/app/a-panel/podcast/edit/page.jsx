/* eslint-disable no-undef */
'use client';
import Button from '@/components/Ui/Button/Button';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import React, { useEffect, useRef, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Image from 'next/image';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import { SiCastbox, SiApplepodcasts, SiSpotify } from 'react-icons/si';
import { PiGooglePodcastsLogoFill } from 'react-icons/pi';
import { IoClose } from 'react-icons/io5';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { useRouter } from 'next/navigation';

const PodcastEditPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [bannerUploadLoading, setBannerUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tag, setTag] = useState('');
  const router = useRouter();

  const [id, setId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [language, setLanguage] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [rssFeed, setRssFeed] = useState('');
  const [email, setEmail] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [castboxUrl, setCastboxUrl] = useState('');
  const [appleUrl, setAppleUrl] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState([]);

  const [errorMessages, setErrorMessages] = useState({
    logoUrl: '',
    bannerUrl: '',
    title: '',
    slug: '',
    description: '',
    hostName: '',
    language: '',
    websiteUrl: '',
    rssFeed: '',
    email: '',
    explicit: '',
    keywords: '',
  });

  const fetchPodcastData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/podcast`,
      );
      if (!response.ok) throw new Error('Failed to fetch podcast data');
      const data = await response.json();
      setId(data?.id);
      setLogoUrl(data?.logoUrl || '');
      setBannerUrl(data?.bannerUrl || '');
      setTitle(data?.title || '');
      setSlug(data?.slug || '');
      setDescription(data?.description || '');
      setHostName(data?.hostName || '');
      setLanguage(data?.language || '');
      setWebsiteUrl(data?.websiteUrl || '');
      setRssFeed(data?.rssFeed || '');
      setEmail(data?.email || '');
      setExplicit(data?.explicit || false);
      setCastboxUrl(data?.castboxUrl || '');
      setAppleUrl(data?.appleUrl || '');
      setGoogleUrl(data?.googleUrl || '');
      setSpotifyUrl(data?.spotifyUrl || '');
      setMetaTitle(data?.metaTitle || '');
      setMetaDescription(data?.metaDescription || '');
      setKeywords(
        Array.isArray(data.keywords)
          ? data.keywords.map((keyword) => keyword.replace(/^"|"$/g, '')) // اگر آرایه است، دبل کوتیشن‌ها رو از هر ایتم حذف کن
          : data.keywords
            ? data.keywords
                .split(' ، ') // جدا کردن کلمات
                .map((keyword) => keyword.replace(/^"|"$/g, '')) // حذف دبل کوتیشن‌ها از اول و آخر هر کلمه
            : [], // در غیر این صورت آرایه خالی
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPodcastData();
  }, []);

  const validateInputs = () => {
    let errors = {};

    if (!title.trim()) {
      errors.title = 'عنوان پادکست نمی‌تواند خالی باشد.';
    }

    if (!description.trim()) {
      errors.description = 'توضیحات پادکست نمی‌تواند خالی باشد.';
    }
    if (!logoUrl.trim()) {
      errors.logoUrl = 'لوگو پادکست را انتخاب کنید';
    }
    if (!bannerUrl.trim()) {
      errors.bannerUrl = 'بنر پادکست را انتخاب کنید';
    }
    if (!hostName.trim()) {
      errors.hostName = 'نام میزبان پادکست را انتخاب کنید';
    }
    if (!slug.trim()) {
      errors.slug = 'اسلاگ نمی‌تواند خالی باشد.';
    } else if (!/^[a-z]+(-[a-z]+)*$/.test(slug)) {
      errors.slug =
        'اسلاگ باید فقط شامل حروف انگلیسی کوچک و خط تیره باشد. استفاده از عدد، فاصله یا کاراکترهای دیگر مجاز نیست.';
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
        id,
        title,
        description,
        keywords: keywords.join(' ، '),
        slug,
        logoUrl,
        bannerUrl,
        hostName,
        language,
        websiteUrl,
        rssFeed,
        email,
        explicit,
        spotifyUrl,
        appleUrl,
        googleUrl,
        castboxUrl,
        metaTitle,
        metaDescription,
      };
      setSubmitLoading(true);
      const response = await fetch('/api/admin/podcast', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Filed to send data!');
      }
      toast.showSuccessToast('بروزرسانی با موفقیت انجام شد.');
      router.replace('/a-panel/podcast');
    } catch (error) {
      toast.showErrorToast('خطا در ارسال اطلاعات');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePodcastLogoClick = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handlePodcastLogoChange = async (event) => {
    setLogoUploadLoading(true);
    const file = event.target.files[0];
    if (file) {
      // شروع فرآیند آپلود
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', 'podcast');
      formData.append('fileName', 'podcast-logo');

      try {
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
          setLogoUrl(imageUrl.fileUrl);
          toast.showSuccessToast('تصویر با موفقیت آپلود شد');
        } else {
          toast.showErrorToast.error('خطا در آپلود تصویر');
        }
      } catch (error) {
        toast.showErrorToast('خطا در آپلود:', error);
        console.error('logo upload error: ', error);
      } finally {
        setLogoUploadLoading(false);
      }
    }
  };

  const getLogoSrcWithCacheBypass = () => {
    if (!logoUrl) return '';
    return `${logoUrl}?timestamp=${new Date().getTime()}`;
  };

  const handlePodcastBannerClick = () => {
    if (bannerInputRef.current) {
      bannerInputRef.current.click();
    }
  };

  const handlePodcastBannerChange = async (event) => {
    setBannerUploadLoading(true);
    const file = event.target.files[0];
    if (file) {
      // شروع فرآیند آپلود
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', 'podcast');
      formData.append('fileName', 'podcast-banner');

      try {
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
          setBannerUrl(imageUrl.fileUrl);
          toast.showSuccessToast('تصویر با موفقیت آپلود شد');
        } else {
          toast.showErrorToast.error('خطا در آپلود تصویر');
        }
      } catch (error) {
        toast.showErrorToast('خطا در آپلود:', error);
        console.error('banner upload error: ', error);
      } finally {
        setBannerUploadLoading(false);
      }
    }
  };

  const getBannerSrcWithCacheBypass = () => {
    if (!bannerUrl) return '';
    return `${bannerUrl}?timestamp=${new Date().getTime()}`;
  };

  const handleAddTag = () => {
    if (!tag && tag.length < 3) {
      toast.showErrorToast('هر تگ حداقل باید ۳ کارکتر باشد.');
      return;
    }
    if (keywords.length === 10) {
      toast.showErrorToast('حداکثر تعداد تگ مجاز به پایان رسید.');
      return;
    }

    if (keywords.find((tagElem) => tagElem === tag)) {
      setTag('');
      return;
    }
    setKeywords((prev) => [...prev, tag]);
    setTag('');
  };

  const handleRemoveTag = (tagRemoved) => {
    setKeywords((prev) => prev.filter((tag) => tag !== tagRemoved));
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <PageTitle>ویرایش پادکست</PageTitle>
        <Button
          shadow
          className='text-xs md:text-sm xl:text-base'
          isLoading={submitLoading}
          onClick={handleSubmitChanges}
        >
          بروزرسانی
        </Button>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <div>
            <input
              type='file'
              ref={logoInputRef}
              className='hidden'
              accept='image/*'
              onChange={handlePodcastLogoChange}
            />
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              تصویر لوگو
            </label>
            {logoUrl ? (
              <div onClick={handlePodcastLogoClick} className='relative'>
                <Image
                  src={getLogoSrcWithCacheBypass()}
                  alt='samane yoga podcast logo'
                  width={300}
                  height={300}
                  className={`h-28 w-28 rounded-xl object-cover xs:h-40 xs:w-40 md:cursor-pointer lg:h-56 lg:w-56 ${errorMessages.logoUrl ? 'border border-red' : ''}`}
                />
                <div
                  className={`absolute left-2 top-2 flex rounded-xl bg-black bg-opacity-50 p-2 md:cursor-pointer ${logoUploadLoading ? 'hidden' : ''}`}
                >
                  <FiEdit2 className='text-white' />
                </div>
                {logoUploadLoading && (
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
                className={`flex h-28 w-44 items-center justify-center rounded-xl bg-surface-light xs:h-40 xs:w-72 lg:h-56 lg:w-96 dark:bg-surface-dark ${errorMessages.logoUrl ? 'border border-red' : ''}`}
              >
                {logoUploadLoading ? (
                  <AiOutlineLoading3Quarters
                    size={34}
                    className='animate-spin text-secondary'
                  />
                ) : (
                  <div
                    className='flex h-full w-full items-center justify-center gap-2 px-4 md:cursor-pointer'
                    onClick={handlePodcastLogoClick}
                  >
                    <MdOutlineAddAPhoto size={34} />
                    <p className='text-xs md:text-sm'>
                      برای افزودن لوگو پادکست کلیک کنید
                    </p>
                  </div>
                )}
              </div>
            )}
            {errorMessages.logoUrl && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.logoUrl}
              </p>
            )}
          </div>
        </div>
        <div className='flex gap-2 self-start'>
          <div>
            <input
              type='file'
              ref={bannerInputRef}
              className='hidden'
              accept='image/*'
              onChange={handlePodcastBannerChange}
            />
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              تصویر بنر پادکست
            </label>
            {bannerUrl ? (
              <div onClick={handlePodcastBannerClick} className='relative'>
                <Image
                  src={getBannerSrcWithCacheBypass()}
                  alt='samane yoga podcast banner'
                  width={800}
                  height={600}
                  className={`h-28 w-44 rounded-xl object-cover xs:h-40 xs:w-72 md:cursor-pointer lg:h-56 lg:w-96 ${errorMessages.bannerUrl ? 'border border-red' : ''}`}
                />
                <div
                  className={`absolute left-2 top-2 flex rounded-xl bg-black bg-opacity-50 p-2 md:cursor-pointer ${bannerUploadLoading ? 'hidden' : ''}`}
                >
                  <FiEdit2 className='text-white' />
                </div>
                {bannerUploadLoading && (
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
                className={`flex h-28 w-44 items-center justify-center rounded-xl bg-surface-light xs:h-40 xs:w-72 lg:h-56 lg:w-96 dark:bg-surface-dark ${errorMessages.bannerUrl ? 'border border-red' : ''}`}
              >
                {bannerUploadLoading ? (
                  <AiOutlineLoading3Quarters
                    size={34}
                    className='animate-spin text-secondary'
                  />
                ) : (
                  <div
                    className='flex h-full w-full items-center justify-center gap-2 px-4 md:cursor-pointer'
                    onClick={handlePodcastBannerClick}
                  >
                    <MdOutlineAddAPhoto size={34} />
                    <p className='text-xs md:text-sm'>
                      برای افزودن بنر پادکست کلیک کنید
                    </p>
                  </div>
                )}
              </div>
            )}
            {errorMessages.bannerUrl && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.bannerUrl}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='عنوان اصلی پادکست را وارد کنید'
          label='عنوان پادکست'
          value={title}
          onChange={setTitle}
          errorMessage={errorMessages.title}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='آدرس URL (Slug) پادکست را وارد کنید'
          label='آدرس URL (slug)'
          value={slug}
          onChange={setSlug}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8'>
        <TextArea
          fullWidth
          maxLength={500}
          placeholder='توضیحات کلی پادکست را وارد کنید'
          label='توضیحات پادکست'
          value={description}
          onChange={setDescription}
          errorMessage={errorMessages.description}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='نام میزبان پادکست را وارد کنید'
          label='نام میزبان'
          value={hostName}
          onChange={setHostName}
          errorMessage={errorMessages.hostName}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <DropDown
          fullWidth
          placeholder='زبان پادکست را انتخاب کنید'
          label='زبان پادکست'
          value={language}
          onChange={setLanguage}
          options={[
            {
              label: 'فارسی - FA',
              value: 'fa',
            },
            { label: 'انگلیسی - EN', value: 'en' },
          ]}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='آدرس سایت پادکست را وارد کنید (اختیاری)'
          label='آدرس سایت اصلی'
          value={websiteUrl}
          onChange={setWebsiteUrl}
          errorMessage={errorMessages.websiteUrl}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='لینک RSS Feed پادکست را وارد کنید (اختیاری)'
          label='RSS Feed'
          value={rssFeed}
          onChange={setRssFeed}
          errorMessage={errorMessages.rssFeed}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />

        <Input
          fullWidth
          placeholder='لینک RSS Feed پادکست را وارد کنید (اختیاری)'
          label='RSS Feed'
          value={email}
          onChange={setEmail}
          errorMessage={errorMessages.email}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <div className='mb-3 flex items-end'>
          <Checkbox
            checked={explicit}
            onChange={setExplicit}
            label='آیا پادکست محتوای بزرگسال دارد؟'
            labelClass='sm:text-base text-sm'
          />
        </div>
      </div>
      <h4 className='mt-10 text-sm font-semibold xs:text-base md:text-lg'>
        لینک به پادگیر ها
      </h4>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='relative xs:w-full'>
          <Input
            fullWidth
            placeholder='لینک کست‌باکس را وارد کنید (اختیاری)'
            label='لینک کست باکس'
            value={castboxUrl}
            onChange={setCastboxUrl}
            errorMessage={errorMessages.castboxUrl}
            className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
          />
          <SiCastbox
            size={28}
            className={`absolute right-2 top-[42px] ${errorMessages.castboxUrl ? 'text-red' : 'text-secondary'}`}
          />
        </div>
        <div className='relative xs:w-full'>
          <Input
            fullWidth
            placeholder='لینک اپل پادکست را وارد کنید (اختیاری)'
            label='لینک اپل پادکست'
            value={appleUrl}
            onChange={setAppleUrl}
            errorMessage={errorMessages.appleUrl}
            className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
          />
          <SiApplepodcasts
            size={28}
            className={`absolute right-2 top-[42px] ${errorMessages.appleUrl ? 'text-red' : 'text-secondary'}`}
          />
        </div>
        <div className='relative xs:w-full'>
          <Input
            fullWidth
            placeholder='لینک گوگل پادکست را وارد کنید (اختیاری)'
            label=' لینک گوگل پادکست'
            value={googleUrl}
            onChange={setGoogleUrl}
            errorMessage={errorMessages.googleUrl}
            className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
          />
          <PiGooglePodcastsLogoFill
            size={28}
            className={`absolute right-2 top-[42px] ${errorMessages.googleUrl ? 'text-red' : 'text-secondary'}`}
          />
        </div>
        <div className='relative xs:w-full'>
          <Input
            fullWidth
            placeholder='لینک اسپاتیفای پادکست را وارد کنید (اختیاری)'
            label='لینک اسپاتیفای پادکست'
            value={spotifyUrl}
            onChange={setSpotifyUrl}
            errorMessage={errorMessages.spotifyUrl}
            className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
          />
          <SiSpotify
            size={28}
            className={`absolute right-2 top-[42px] ${errorMessages.spotifyUrl ? 'text-red' : 'text-secondary'}`}
          />
        </div>
      </div>
      <h4 className='mt-10 text-sm font-semibold xs:text-base md:text-lg'>
        سئو پادکست
      </h4>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='عنوان سئو پادکست را وارد کنید (اختیاری)'
          label='عنوان سئو'
          value={metaTitle}
          onChange={setMetaTitle}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <TextArea
          fullWidth
          placeholder='توضیحات سئو پادکست را وارد کنید (اختیاری)'
          label='توضیحات سئو'
          value={metaDescription}
          onChange={setMetaDescription}
          maxLength={160}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <div className='relative w-full'>
            <Input
              maxLength={45}
              label='کلمات کلیدی سایت'
              placeholder='کلمه کلیدی مرتبط با محتوای سایت را وارد کنید'
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
        </div>
        {keywords.length !== 0 && (
          <div className='rounded-xl border border-dashed border-subtext-light px-6 pb-5 pt-3 sm:mt-4 dark:border-subtext-dark'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h4>لیست تگ ها</h4>
              <h4 className='font-faNa text-xs text-subtext-light md:text-sm dark:text-subtext-dark'>
                10/{keywords.length}
              </h4>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {keywords.map((tag, index) => (
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
    </div>
  );
};

export default PodcastEditPage;
