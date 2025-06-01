'use client';
/* eslint-disable react/jsx-key */
/* eslint-disable no-undef */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { ImSpinner2 } from 'react-icons/im';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Image from 'next/image';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { getStringTime } from '@/utils/dateTimeHelper';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import TimePicker from 'react-multi-date-picker/plugins/analog_time_picker';
import { useRouter } from 'next/navigation';

const EpisodeForm = ({ id, podcastId, className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef(null);
  const [coverUploadLoading, setCoverUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tag, setTag] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [seasonNumber, setSeasonNumber] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [explicit, setExplicit] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [podcastIdTemp, setPodcastIdTemp] = useState(podcastId);

  const [errorMessages, setErrorMessages] = useState({
    title: '',
    slug: '',
    description: '',
    audioUrl: '',
    duration: '',
    coverImageUrl: '',
    publishedAt: '',
  });

  const fetchEpisodeData = async () => {
    try {
      if (id) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/podcast/episode/${id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title);
          setSlug(data.slug);
          setDescription(data.description);
          setAudioUrl(data.audioUrl);
          setDuration(data.duration);
          setSeasonNumber(data.seasonNumber);
          setEpisodeNumber(data.episodeNumber);
          setCoverImageUrl(data.coverImageUrl);
          setExplicit(data.explicit);
          setMetaTitle(data.metaTitle);
          setMetaDescription(data.metaDescription);
          setPublishedAt(new DateObject(data.publishedAt));
          setPodcastIdTemp(data.podcastId);
          setKeywords(
            Array.isArray(data.keywords)
              ? data.keywords.map((keyword) => keyword.replace(/^"|"$/g, '')) // اگر آرایه است، دبل کوتیشن‌ها رو از هر ایتم حذف کن
              : data.keywords
                ? data.keywords
                    .split(' ، ') // جدا کردن کلمات
                    .map((keyword) => keyword.replace(/^"|"$/g, '')) // حذف دبل کوتیشن‌ها از اول و آخر هر کلمه
                : [],
          );
        } else {
          toast.showErrorToast(data.error || 'خطایی رخ داده است');
        }
      }
    } catch (error) {
      toast.showErrorToast(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEpisodeData();
    }
  }, [id]);

  const validateInputs = () => {
    let errors = {};

    if (!title.trim()) {
      errors.title = 'عنوان اپیزود نمی‌تواند خالی باشد.';
    }

    if (!description.trim()) {
      errors.description = 'توضیحات اپیزود نمی‌تواند خالی باشد.';
    }
    if (!audioUrl.trim()) {
      errors.audioUrl = 'فایل صوتی را انتخاب کنید';
    }
    try {
      if (!duration.trim()) {
        errors.duration = 'زمان اپیزود را بر حسب ثانیه وارد کنید';
      }
    } catch (err) {
      console.log(err);
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
        podcastId: podcastIdTemp,
        title,
        description,
        keywords: keywords.join(' ، '),
        slug,
        audioUrl,
        duration: Number(duration),
        seasonNumber: seasonNumber ? Number(seasonNumber) : null,
        episodeNumber: episodeNumber ? Number(episodeNumber) : null,
        coverImageUrl,
        explicit,
        metaTitle,
        metaDescription,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      };
      const method = id ? 'PUT' : 'POST';
      setSubmitLoading(true);
      const response = await fetch('/api/admin/podcast/episode', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Filed to send data!');
      }
      toast.showSuccessToast(
        id ? 'بروزرسانی با موفقیت انجام شد.' : 'ایپزود جدید با موفقیت ثبت شد.',
      );
      router.replace('/a-panel/podcast');
    } catch (error) {
      toast.showErrorToast('خطا در ارسال اطلاعات');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const publishDatePickerHandler = (event) => {
    setPublishedAt(event);
  };

  const handleUploadAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!title) {
      toast.showErrorToast('ابتدا عنوان اپیزود را وارد کنید');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', `podcast/${slugifyTitle(title)}`); // مسیر دلخواه
    formData.append('fileName', 'audio'); // بدون پسوند

    setUploading(true);

    try {
      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در آپلود فایل صوتی');
      }
      setAudioUrl(data.fileUrl); // فایل با موفقیت آپلود شده
    } catch (err) {
      toast.showErrorToast(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEpisodeCoverClick = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleEpisodeCoverChange = async (event) => {
    if (!title) {
      toast.showErrorToast('ابتدا عنوان اپیزود را وارد کنید');
      return;
    }
    setCoverUploadLoading(true);
    const file = event.target.files[0];
    if (file) {
      // شروع فرآیند آپلود
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', `podcast/${title}`);
      formData.append('fileName', 'cover');

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
          setCoverImageUrl(imageUrl.fileUrl);
          toast.showSuccessToast('تصویر با موفقیت آپلود شد');
        } else {
          toast.showErrorToast.error('خطا در آپلود تصویر');
        }
      } catch (error) {
        toast.showErrorToast('خطا در آپلود:', error);
        console.error('cover upload error: ', error);
      } finally {
        setCoverUploadLoading(false);
      }
    }
  };

  const getCoverSrcWithCacheBypass = () => {
    if (!coverImageUrl) return '';
    return `${coverImageUrl}?timestamp=${new Date().getTime()}`;
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

  const slugifyTitle = (title) => {
    return title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9\\-]+/gi, '');
  };

  return (
    <div className={className}>
      <div className='flex items-center justify-between'>
        <PageTitle>{id ? 'ویرایش اپیزود' : 'اپیزود جدید'}</PageTitle>
        <Button
          shadow
          className='text-xs sm:text-sm xl:text-base'
          isLoading={submitLoading}
          onClick={handleSubmitChanges}
        >
          {id ? 'بروزرسانی' : 'ثبت'}
        </Button>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='عنوان اپیزود را وارد کنید'
          label='عنوان اپیزود'
          value={title}
          onChange={setTitle}
          errorMessage={errorMessages.title}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='آدرس URL (Slug) اپیزود  را وارد کنید'
          label='آدرس URL (slug)'
          value={slug}
          onChange={setSlug}
          errorMessage={errorMessages.slug}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8'>
        <TextArea
          fullWidth
          maxLength={500}
          placeholder='توضیحات کلی اپیزود  را وارد کنید'
          label='توضیحات اپیزود'
          value={description}
          onChange={setDescription}
          errorMessage={errorMessages.description}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div>
          <label className='mb-1 block text-xs sm:text-sm'>
            فایل صوتی اپیزود
          </label>

          <input
            id='audio-upload'
            type='file'
            accept='.mp3,.m4a,.wav,.aac,.ogg,audio/*'
            onChange={handleUploadAudio}
            className='hidden'
          />

          <label
            htmlFor='audio-upload'
            className='hover:bg-accent-dark mt-1 inline-flex w-full cursor-pointer items-center gap-2 rounded-xl border border-accent bg-surface-light px-4 py-2 text-sm transition dark:bg-surface-dark'
          >
            <FiPlus />
            انتخاب فایل صوتی
          </label>

          {uploading && (
            <p className='mt-2 flex items-center gap-2 text-sm text-gray-500'>
              در حال آپلود <ImSpinner2 className='animate-spin' />
            </p>
          )}

          {audioUrl && (
            <audio
              controls
              className='mt-4 w-full rounded-full border border-accent'
            >
              <source
                src={`/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`}
                type='audio/mpeg'
              />
              مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
            </audio>
          )}
        </div>
        <div>
          <div>
            <Input
              fullWidth
              placeholder='مدت زمان اپیزود را به ثانیه وارد کنید'
              label='مدت زمان (ثانیه)'
              value={duration}
              onChange={setDuration}
              errorMessage={errorMessages.duration}
              type='number'
              className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
            />
            <p className='mr-2 mt-1 font-faNa text-green sm:text-sm'>
              {duration && getStringTime(duration)}
            </p>
          </div>
        </div>
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Input
          fullWidth
          placeholder='شماره فصل را وارد کنید'
          label='شماره فصل (اختیاری)'
          value={seasonNumber}
          onChange={setSeasonNumber}
          type='number'
          maxLength={3}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          fullWidth
          placeholder='شماره اپیزود را وارد کنید'
          label='شماره اپیزود (اختیاری)'
          value={episodeNumber}
          onChange={setEpisodeNumber}
          type='number'
          maxLength={3}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='flex gap-2 self-start'>
          <div>
            <input
              type='file'
              ref={coverInputRef}
              className='hidden'
              accept='image/*'
              onChange={handleEpisodeCoverChange}
            />
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              تصویر کاور اپیزود
            </label>
            {coverImageUrl ? (
              <div onClick={handleEpisodeCoverClick} className='relative'>
                <Image
                  src={getCoverSrcWithCacheBypass()}
                  alt='episode cover image'
                  width={800}
                  height={600}
                  className={`h-28 w-44 rounded-xl object-cover xs:h-40 xs:w-72 md:cursor-pointer lg:h-56 lg:w-96 ${errorMessages.coverImageUrl ? 'border border-red' : ''}`}
                />
                <div
                  className={`absolute left-2 top-2 flex rounded-xl bg-black bg-opacity-50 p-2 md:cursor-pointer ${coverUploadLoading ? 'hidden' : ''}`}
                >
                  <FiEdit2 className='text-white' />
                </div>
                {coverUploadLoading && (
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
                className={`flex h-28 w-44 items-center justify-center rounded-xl bg-surface-light xs:h-40 xs:w-72 lg:h-56 lg:w-96 dark:bg-surface-dark ${errorMessages.coverImageUrl ? 'border border-red' : ''}`}
              >
                {coverUploadLoading ? (
                  <AiOutlineLoading3Quarters
                    size={34}
                    className='animate-spin text-secondary'
                  />
                ) : (
                  <div
                    className='flex h-full w-full items-center justify-center gap-2 px-4 md:cursor-pointer'
                    onClick={handleEpisodeCoverClick}
                  >
                    <MdOutlineAddAPhoto size={34} />
                    <p className='text-xs md:text-sm'>
                      برای افزودن کاور اپیزود کلیک کنید
                    </p>
                  </div>
                )}
              </div>
            )}
            {errorMessages.coverImageUrl && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.coverImageUrl}
              </p>
            )}
          </div>
        </div>
        <div className='mb-3 flex flex-col gap-8'>
          <div className='w-full'>
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              زمان انتشار
            </label>
            <div
              className={`rounded-xl border border-solid ${errorMessages.publishedAt ? 'border-red focus:ring-red' : 'border-accent focus:ring-accent'} bg-background-light transition duration-200 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 dark:bg-surface-dark placeholder:dark:text-subtext-dark`}
            >
              <DatePicker
                format='MM/DD/YYYY HH:mm:ss'
                plugins={[<TimePicker position='left' />]}
                calendar={persian}
                locale={persian_fa}
                calendarPosition='bottom-right'
                value={publishedAt}
                onChange={publishDatePickerHandler}
                className='bg-dark text-black'
                inputClass='custom-input-datepicker'
                placeholder='انتخاب تاریخ انقضا'
              />
            </div>
            {errorMessages.publishedAt && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.publishedAt}
              </p>
            )}
          </div>
          <Checkbox
            checked={explicit}
            onChange={setExplicit}
            label='آیا پادکست محتوای بزرگسال دارد؟'
            labelClass='sm:text-base text-sm'
          />
        </div>
      </div>
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

EpisodeForm.propTypes = {
  id: PropTypes.string,
  podcastId: PropTypes.string,
  className: PropTypes.string,
};

export default EpisodeForm;
