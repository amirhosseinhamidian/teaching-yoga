/* eslint-disable no-undef */
'use client';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import TextArea from '@/components/Ui/TextArea/TextArea';
import React, { useEffect, useRef, useState } from 'react';
import { FaInstagram } from 'react-icons/fa6';
import { RiTelegram2Fill } from 'react-icons/ri';
import { RiYoutubeLine } from 'react-icons/ri';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { FiPlus } from 'react-icons/fi';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import FooterAddedItem from './FooterAddedItem';
import Image from 'next/image';
import { FiEdit2 } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';

function SettingContent() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [infos, setInfos] = useState({});
  const [descriptionFooter, setDescriptionFooter] = useState('');
  const [descriptionAboutUs, setDescriptionAboutUs] = useState('');
  const [rules, setRules] = useState('');
  const [siteEmail, setSiteEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [courseOptions, setCourseOptions] = useState([]);
  const [articleOptions, setArticleOptions] = useState([]);
  const [courseFooter, setCourseFooter] = useState(null);
  const [articleFooter, setArticleFooter] = useState(null);
  const [courseFooterSelected, setCoursesFooterSelected] = useState([]);
  const [articlesFooterSelected, setArticlesFooterSelected] = useState([]);
  const [usefulLinkTitle, setUsefulLinkTitle] = useState('');
  const [usefulLink, setUsefulLink] = useState('');
  const [usefulLinksSelected, setUsefulLinksSelected] = useState([]);
  const [heroImage, setHeroImage] = useState('');
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [teachingMethodImage, setTeachingMethodImage] = useState('');
  const [teachingMethodImagePreview, setTeachingMethodImagePreview] =
    useState('');
  const [heroImageUploadLoading, setHeroImageUploadLoading] = useState(false);
  const [
    teachingMethodImageUploadLoading,
    setTeachingMethodImageUploadLoading,
  ] = useState(false);
  const heroFileInputRef = useRef(null);
  const teachingMethodFileInputRef = useRef(null);
  const heroPreviewObjectUrlRef = useRef(null);
  const teachingMethodPreviewObjectUrlRef = useRef(null);
  const [errorMessages, setErrorMessages] = useState({
    descriptionFooter: '',
    rules: '',
    descriptionAboutUs: '',
    siteEmail: '',
    instagramLink: '',
    telegramLink: '',
    youtubeLink: '',
  });

  const fetchInfosData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info`
      );
      if (!response.ok) throw new Error('Failed to fetch site infos');
      const data = await response.json();
      setInfos(data);
      setDescriptionFooter(data?.shortDescription || '');
      setRules(data?.rules || '');
      setDescriptionAboutUs(data?.fullDescription || '');
      setAddress(data?.companyAddress || '');
      setPhone(data?.companyPhone || '');
      setSiteEmail(data?.companyEmail || '');
      setInstagramLink(data?.socialLinks?.instagram || '');
      setTelegramLink(data?.socialLinks?.telegram || '');
      setYoutubeLink(data?.socialLinks?.youtube || '');
      setCoursesFooterSelected(data?.coursesLinks || []);
      setArticlesFooterSelected(data?.articlesLinks || []);
      setUsefulLinksSelected(data?.usefulLinks || []);
      setHeroImage(data?.heroImage || '');
      setHeroImagePreview(data?.heroImageUrl || '');
      setTeachingMethodImage(data?.teachingMethodImage || '');
      setTeachingMethodImagePreview(data?.teachingMethodImageUrl || '');
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFooterInfosData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info/footer-info`
      );
      if (!response.ok) throw new Error('Failed to fetch site footer infos');
      const data = await response.json();
      setCourseOptions(data.courses);
      setArticleOptions(data.articles);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInfosData();
    fetchFooterInfosData();
  }, []);

  useEffect(() => {
    return () => {
      if (heroPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(heroPreviewObjectUrlRef.current);
      }

      if (teachingMethodPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(teachingMethodPreviewObjectUrlRef.current);
      }
    };
  }, []);

  const handleSubmitCourseFooter = () => {
    if (courseFooterSelected.length === 3) {
      toast.showErrorToast(
        'حداکثر ۳ مورد را می توانید اضافه کنید. ابتدا یک گزینه را حذف کنید.'
      );
      return;
    }
    const courseSelected = courseOptions.find(
      (cpt) => cpt.value === courseFooter
    );
    if (courseSelected) {
      setCoursesFooterSelected((prev) => {
        if (!prev.some((course) => course.value === courseSelected.value)) {
          return [...prev, courseSelected];
        }
        return prev;
      });
    }
    setCourseFooter(null);
  };

  const handleSubmitArticleFooter = () => {
    if (articlesFooterSelected.length === 3) {
      toast.showErrorToast(
        'حداکثر ۳ مورد را می توانید اضافه کنید. ابتدا یک گزینه را حذف کنید.'
      );
      return;
    }
    const articleSelected = articleOptions.find(
      (cpt) => cpt.value === articleFooter
    );
    if (articleSelected) {
      setArticlesFooterSelected((prev) => {
        if (!prev.some((article) => article.value === articleSelected.value)) {
          return [...prev, articleSelected];
        }
        return prev;
      });
    }
    setArticleFooter(null);
  };

  const handleSubmitUsefulLink = () => {
    if (usefulLinksSelected.length === 3) {
      toast.showErrorToast(
        'حداکثر ۳ مورد را می توانید اضافه کنید. ابتدا یک گزینه را حذف کنید.'
      );
      return;
    }

    if (usefulLinkTitle && usefulLink) {
      setUsefulLinksSelected((prev) => {
        if (!prev.some((usefulLink) => usefulLink.value === usefulLink)) {
          const usefulObj = { label: usefulLinkTitle, value: usefulLink };
          return [...prev, usefulObj];
        }
        return prev;
      });
      setUsefulLink('');
      setUsefulLinkTitle('');
    }
  };

  const handleDeleteCourse = (shortAddress) => {
    setCoursesFooterSelected((prev) =>
      prev.filter((item) => item.value !== shortAddress)
    );
  };

  const handleDeleteArticle = (itemId) => {
    setArticlesFooterSelected((prev) =>
      prev.filter((item) => item.value !== itemId)
    );
  };

  const handleDeleteUsefulLink = (itemLink) => {
    setUsefulLinksSelected((prev) =>
      prev.filter((item) => item.value !== itemLink)
    );
  };

  const setLocalImagePreview = ({ file, objectUrlRef, setPreview }) => {
    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);

    objectUrlRef.current = objectUrl;

    setPreview(objectUrl);
  };

  const uploadSiteImage = async ({
    file,
    fileName,
    setStorageKey,
    setLoading,
  }) => {
    if (!file) {
      return;
    }

    setLoading(true);

    const formData = new FormData();

    formData.append('file', file);

    formData.append('folderPath', 'images/home');

    formData.append('fileName', fileName);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Image upload failed');
      }

      /*
       * فقط storage key را نگه می‌داریم.
       *
       * مثال:
       * images/home/teaching-method.jpg
       */
      const fileKey = String(data?.fileKey || '').trim();

      if (!fileKey) {
        throw new Error('Storage key was not returned');
      }

      setStorageKey(fileKey);

      /*
       * اینجا دیگر Preview را از absoluteUrl
       * یا fileUrl نمی‌سازیم.
       *
       * Preview قبلاً با URL.createObjectURL
       * ساخته شده است.
       */

      toast.showSuccessToast('تصویر با موفقیت آپلود شد');
    } catch (error) {
      console.error('[SITE_SETTING_IMAGE_UPLOAD_ERROR]', error);

      toast.showErrorToast('خطا در آپلود تصویر');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Preview فوری از خود فایل
     */
    setLocalImagePreview({
      file,

      objectUrlRef: heroPreviewObjectUrlRef,

      setPreview: setHeroImagePreview,
    });

    /*
     * آپلود واقعی
     */
    uploadSiteImage({
      file,

      fileName: 'hero',

      setStorageKey: setHeroImage,

      setLoading: setHeroImageUploadLoading,
    });

    event.target.value = '';
  };

  const handleTeachingMethodImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Preview فوری
     */
    setLocalImagePreview({
      file,

      objectUrlRef: teachingMethodPreviewObjectUrlRef,

      setPreview: setTeachingMethodImagePreview,
    });

    /*
     * آپلود
     */
    uploadSiteImage({
      file,

      fileName: 'teaching-method',

      setStorageKey: setTeachingMethodImage,

      setLoading: setTeachingMethodImageUploadLoading,
    });

    event.target.value = '';
  };

  const validateInputs = () => {
    let errors = {};

    if (!descriptionFooter.trim()) {
      errors.descriptionFooter = 'توضیحات نمی‌تواند خالی باشد.';
    }

    if (descriptionFooter.trim().length < 10) {
      errors.descriptionFooter = 'توضیحات نمی‌تواند کمتر از ۱۰ کارکتر باشد.';
    }

    if (!descriptionAboutUs.trim()) {
      errors.descriptionAboutUs = 'توضیحات نمی‌تواند خالی باشد.';
    }

    if (descriptionAboutUs.trim().length < 50) {
      errors.descriptionAboutUs = 'توضیحات نمی‌تواند کمتر از ۵۰ کارکتر باشد.';
    }

    if (!rules.trim()) {
      errors.descriptionAboutUs = 'قوانین نمی‌تواند خالی باشد.';
    }

    if (!heroImage.trim()) {
      errors.heroImage = 'تصویری برای قسمت هیرو انتخاب کنید.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(siteEmail)) {
      errors.siteEmail = 'لطفا یک ایمیل معتبر وارد کنید';
    }

    // اعتبارسنجی لینک اینستاگرام
    const instagramRegex =
      /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._-]+(?:\/[\w\\-]*)?(?:\?[a-zA-Z0-9&=._-]+)?\/?$/;

    if (
      instagramLink &&
      instagramLink.trim() &&
      !instagramRegex.test(instagramLink.trim())
    ) {
      errors.instagramLink = 'لطفا لینک اینستاگرام معتبر وارد کنید.';
    }

    // اعتبارسنجی لینک تلگرام
    const telegramRegex = /^(https?:\/\/)?(www\.)?t\.me\/[a-zA-Z0-9_]+\/?$/;
    if (
      telegramLink &&
      telegramLink.trim() &&
      !telegramRegex.test(telegramLink.trim())
    ) {
      errors.telegramLink = 'لطفا لینک تلگرام معتبر وارد کنید.';
    }

    // اعتبارسنجی لینک یوتیوب
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?youtube\.com\/@[\w.-]+(?:\?[a-zA-Z0-9&=._-]+)?\/?$/;
    if (
      youtubeLink &&
      youtubeLink.trim() &&
      !youtubeRegex.test(youtubeLink.trim())
    ) {
      errors.youtubeLink = 'لطفا لینک یوتیوب معتبر وارد کنید.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleSubmitInfos = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر رو به درستی وارد کنید.');
      return;
    }
    try {
      setSubmitLoading(true);
      const method = infos?.id ? 'PUT' : 'POST';
      const payload = {
        id: infos?.id,
        shortDescription: descriptionFooter,
        fullDescription: descriptionAboutUs,
        companyAddress: address,
        companyPhone: phone,
        companyEmail: siteEmail,
        socialLinks: {
          instagram: instagramLink,
          telegram: telegramLink,
          youtube: youtubeLink,
        },
        coursesLinks: courseFooterSelected,
        articlesLinks: articlesFooterSelected,
        usefulLinks: usefulLinksSelected,
        heroImage,
        teachingMethodImage,
        rules,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info`,
        {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error('Error To submit infos form!');
      }
      toast.showSuccessToast('اطلاعات با موفقیت بروز شد.');
    } catch (error) {
      toast.showErrorToast('خطا در ثبت اطلاعات');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <div className='flex flex-wrap items-center justify-between'>
        <PageTitle>اطلاعات اصلی سایت</PageTitle>
        <Button
          className='text-xs sm:text-base'
          shadow
          onClick={handleSubmitInfos}
          isLoading={submitLoading}
        >
          ثبت تغییرات
        </Button>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2'>
        {/* Hero */}
        <div>
          <input
            type='file'
            ref={heroFileInputRef}
            className='hidden'
            accept='image/*'
            onChange={handleHeroImageChange}
          />

          <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
            تصویر هیرو
          </label>

          <div
            className={`relative flex aspect-[16/10] w-full max-w-xl cursor-pointer items-center justify-center overflow-hidden rounded-2xl border bg-surface-light dark:bg-surface-dark ${
              errorMessages.heroImage
                ? 'border-red'
                : 'border-black/5 dark:border-white/10'
            }`}
            onClick={() => heroFileInputRef.current?.click()}
          >
            {heroImagePreview ? (
              <Image
                src={heroImagePreview}
                alt='تصویر هیرو'
                fill
                sizes='600px'
                className='object-cover'
              />
            ) : (
              <div className='flex flex-col items-center gap-2 text-subtext-light dark:text-subtext-dark'>
                <MdOutlineAddAPhoto size={34} />

                <span className='text-xs'>افزودن تصویر هیرو</span>
              </div>
            )}

            {heroImagePreview && !heroImageUploadLoading && (
              <div className='absolute left-3 top-3 flex rounded-xl bg-black/55 p-2 text-white backdrop-blur-md'>
                <FiEdit2 />
              </div>
            )}

            {heroImageUploadLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px]'>
                <AiOutlineLoading3Quarters
                  size={34}
                  className='animate-spin text-white'
                />
              </div>
            )}
          </div>

          {errorMessages.heroImage && (
            <p className='mt-1 text-xs text-red'>*{errorMessages.heroImage}</p>
          )}
        </div>

        {/* Teaching Method */}
        <div>
          <input
            type='file'
            ref={teachingMethodFileInputRef}
            className='hidden'
            accept='image/*'
            onChange={handleTeachingMethodImageChange}
          />

          <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
            تصویر بخش روش آموزش
          </label>

          <div
            className='relative flex aspect-[16/10] w-full max-w-xl cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-surface-light dark:border-white/10 dark:bg-surface-dark'
            onClick={() => teachingMethodFileInputRef.current?.click()}
          >
            {teachingMethodImagePreview ? (
              <Image
                src={teachingMethodImagePreview}
                alt='تصویر بخش روش آموزش'
                fill
                sizes='600px'
                className='object-cover'
              />
            ) : (
              <div className='flex flex-col items-center gap-2 text-subtext-light dark:text-subtext-dark'>
                <MdOutlineAddAPhoto size={34} />

                <span className='text-xs'>افزودن تصویر روش آموزش</span>
              </div>
            )}

            {teachingMethodImagePreview &&
              !teachingMethodImageUploadLoading && (
                <div className='absolute left-3 top-3 flex rounded-xl bg-black/55 p-2 text-white backdrop-blur-md'>
                  <FiEdit2 />
                </div>
              )}

            {teachingMethodImageUploadLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px]'>
                <AiOutlineLoading3Quarters
                  size={34}
                  className='animate-spin text-white'
                />
              </div>
            )}
          </div>

          <p className='mt-2 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
            این تصویر در بخش «روش آموزش سمانه» صفحه اصلی نمایش داده می‌شود.
          </p>
        </div>
      </div>
      <div className='mt-8'>
        <TextArea
          fullWidth
          maxLength={500}
          placeholder='توضیحات سایت برای قسمت فوتر را اینجا بنویسید'
          label='توضحات قسمت فوتر'
          value={descriptionFooter}
          onChange={setDescriptionFooter}
          errorMessage={errorMessages.descriptionFooter}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8'>
        <TextEditor
          fullWidth
          maxLength={4000}
          placeholder='توضیحات سایت برای قسمت درباره ما را اینجا بنویسید'
          label='توضحات قسمت درباره ما'
          value={descriptionAboutUs}
          onChange={setDescriptionAboutUs}
          errorMessage={errorMessages.descriptionAboutUs}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8'>
        <TextEditor
          fullWidth
          maxLength={4000}
          placeholder='قوانین سایت را اینجا بنویسید'
          label='قوانین سایت'
          value={rules}
          onChange={setRules}
          errorMessage={errorMessages.rules}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='ایمیل ارتباطی برای بخش ارتباط با ما و فوتر'
          label='ایمیل ارتباطی'
          value={siteEmail}
          onChange={setSiteEmail}
          errorMessage={errorMessages.siteEmail}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='شماره تماس شرکت برای بخش ارتباط با ما و فوتر'
          label='شماره تماس (اختیاری)'
          value={phone}
          onChange={setPhone}
          type='number'
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='آدرس شرکت برای بخش ارتباط با ما و فوتر'
          label='آدرس (اختیاری)'
          value={address}
          onChange={setAddress}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>

      <div className='my-16'>
        <label className='mb-2 mr-4 block text-lg font-semibold'>
          لینک شبکه های اجتماعی
        </label>
        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div className='relative xs:w-full'>
            <Input
              fullWidth
              placeholder='لینک اینستاگرام را در اینجا وارد کنید'
              label='اینستاگرام'
              value={instagramLink}
              onChange={setInstagramLink}
              errorMessage={errorMessages.instagramLink}
              className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
            />
            <FaInstagram
              size={28}
              className={`absolute right-2 top-[42px] ${errorMessages.instagramLink ? 'text-red' : 'text-secondary'}`}
            />
          </div>
          <div className='relative xs:w-full'>
            <Input
              fullWidth
              placeholder='لینک تلگرام را در اینجا وارد کنید'
              label='تلگرام'
              value={telegramLink}
              onChange={setTelegramLink}
              errorMessage={errorMessages.telegramLink}
              className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
            />
            <RiTelegram2Fill
              size={28}
              className={`absolute right-2 top-[42px] ${errorMessages.telegramLink ? 'text-red' : 'text-secondary'}`}
            />
          </div>
          <div className='relative xs:w-full'>
            <Input
              fullWidth
              placeholder='لینک یوتوب را در اینجا وارد کنید'
              label='یوتوب'
              value={youtubeLink}
              onChange={setYoutubeLink}
              errorMessage={errorMessages.youtubeLink}
              className='bg-surface-light pr-10 text-xs sm:text-sm dark:bg-surface-dark'
            />
            <RiYoutubeLine
              size={30}
              className={`absolute right-2 top-[42px] ${errorMessages.youtubeLink ? 'text-red' : 'text-secondary'}`}
            />
          </div>
        </div>
      </div>
      <div className='my-16'>
        <label className='mr-4 block text-lg font-semibold text-text-light dark:text-text-dark'>
          لینک های فوتر
        </label>
        <p className='mb-2 mr-4 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
          بعد از اتمام اضافه کردن لینک ها حتما روی دکمه ثبت تغییرات کلیک کنید تا
          تغییرات ذخیره شوند.
        </p>
        <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8'>
          <div>
            <div className='flex items-end gap-2 self-start'>
              <DropDown
                fullWidth
                label='دوره ها'
                placeholder='دوره مورد نظر را انتخاب کنید (۳ دوره)'
                options={courseOptions}
                value={courseFooter}
                onChange={setCourseFooter}
              />
              <ActionButtonIcon
                icon={FiPlus}
                color='accent'
                className='mb-1 sm:mb-2'
                onClick={handleSubmitCourseFooter}
              />
            </div>
            {courseFooterSelected &&
              courseFooterSelected.map((course) => (
                <FooterAddedItem
                  key={course.value}
                  data={course}
                  onDelete={(deleteItem) => handleDeleteCourse(deleteItem)}
                />
              ))}
          </div>
          <div>
            <div className='flex items-end gap-2 self-start'>
              <DropDown
                fullWidth
                label='مقاله ها'
                placeholder='مقاله مورد نظر را انتخاب کنید (۳ مقاله)'
                options={articleOptions}
                value={articleFooter}
                onChange={setArticleFooter}
              />
              <ActionButtonIcon
                icon={FiPlus}
                color='accent'
                className='mb-1 sm:mb-2'
                onClick={handleSubmitArticleFooter}
              />
            </div>
            {articlesFooterSelected &&
              articlesFooterSelected.map((article) => (
                <FooterAddedItem
                  key={article.value}
                  data={article}
                  onDelete={(deleteItem) => handleDeleteArticle(deleteItem)}
                />
              ))}
          </div>
          <div>
            <Input
              label='لینک های مفید'
              placeholder='عنوان لینک مورد نظر را وارد کنید'
              fullWidth
              className='mb-4 ml-10 bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
              value={usefulLinkTitle}
              onChange={setUsefulLinkTitle}
            />
            <div className='flex items-end gap-2'>
              <Input
                placeholder='آدرس لینک را بدون URL اصلی سایت وارد کنید'
                fullWidth
                className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
                value={usefulLink}
                onChange={setUsefulLink}
              />
              <ActionButtonIcon
                icon={FiPlus}
                color='accent'
                className='mb-1 sm:mb-2'
                onClick={handleSubmitUsefulLink}
              />
            </div>
            {usefulLinksSelected &&
              usefulLinksSelected.map((usefulLink) => (
                <FooterAddedItem
                  key={usefulLink.value}
                  data={usefulLink}
                  isShowValue
                  onDelete={(deleteItem) => handleDeleteUsefulLink(deleteItem)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingContent;
