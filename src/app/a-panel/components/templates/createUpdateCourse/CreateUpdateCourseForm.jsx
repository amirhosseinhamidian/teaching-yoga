'use client';
import PropTypes from 'prop-types';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';
import {
  ADVANCED,
  BEGINNER,
  BEGINNER_INTERMEDIATE,
  INTERMEDIATE,
  INTERMEDIATE_ADVANCED,
} from '@/constants/courseLevels';
import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import FileUploadModal from '../../modules/FileUploadModal/FileUploadModal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { COMPLETED, IN_PROGRESS } from '@/constants/courseStatus';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import { useRouter } from 'next/navigation';
import { getStringTime } from '@/utils/dateTimeHelper';
import { FaCircleCheck } from 'react-icons/fa6';
import { ImSpinner2 } from 'react-icons/im';
import { IoIosCloseCircle } from 'react-icons/io';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function CreateCourseUpdateForm({ courseToUpdate }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const router = useRouter();

  const [coverLink, setCoverLink] = useState(courseToUpdate?.cover || '');
  const [introLink, setIntroLink] = useState(
    courseToUpdate?.introVideoUrl || '',
  );
  const [title, setTitle] = useState(courseToUpdate?.title || '');
  const [shortDesc, setShortDesc] = useState(courseToUpdate?.subtitle || '');
  const [level, setLevel] = useState(courseToUpdate?.level || '');
  const [status, setStatus] = useState(courseToUpdate?.status || '');
  const [sessionsCount, setSessionsCount] = useState(
    courseToUpdate?.sessionCount || '',
  );
  const [time, setTime] = useState(courseToUpdate?.duration || '');

  const [shortAddress, setShortAddress] = useState(
    courseToUpdate?.shortAddress || '',
  );
  const [highPriority, setHighPriority] = useState(
    courseToUpdate?.isHighPriority || false,
  );
  const [firstDesc, setFirstDesc] = useState(
    courseToUpdate?.shortDescription || '',
  );
  const [completeDesc, setCompleteDesc] = useState(
    courseToUpdate?.description || '',
  );

  const [errorMessages, setErrorMessages] = useState({
    title: '',
    shortDesc: '',
    sessionsCount: '',
    time: '',
    firstDesc: '',
    completeDesc: '',
    shortAddress: '',
    coverLink: '',
    introLink: '',
  });

  const [loading, setLoading] = useState(false);

  const [shortAddressStatus, setShortAddressStatus] = useState('');
  const [shortAddressError, setShortAddressError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const courseLevelOptions = [
    { label: 'مبتدی', value: BEGINNER },
    { label: 'مبتدی متوسط', value: BEGINNER_INTERMEDIATE },
    { label: 'متوسط', value: INTERMEDIATE },
    { label: 'متوسط پیشرفته', value: INTERMEDIATE_ADVANCED },
    { label: 'پیشرفته', value: ADVANCED },
  ];
  const courseStatusOptions = [
    { label: 'کامل شده', value: COMPLETED },
    { label: 'در حال تکمیل', value: IN_PROGRESS },
  ];

  const [openUploadImageModal, setOpenUploadImageModal] = useState(false);
  const [openUploadIntroModal, setOpenUploadIntroModal] = useState(false);

  const handleCoverImageUpload = async (file) => {
    if (!file) {
      toast.showErrorToast('لطفاً یک تصویر انتخاب کنید.');
      return;
    }

    // مسیر ذخیره‌سازی دلخواه
    const folderPath = 'images/course_covers';

    // آپلود فایل
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);

    try {
      const response = await fetch('http://localhost:3000/api/upload/image', {
        method: 'POST',
        body: formData,
      });

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

  const handleIntroVideoUpload = async (file) => {
    if (!file) {
      toast.showErrorToast('لطفاً یک ویدیو انتخاب کنید.');
      return;
    }
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch(
        'http://localhost:3000/api/upload/video/courseIntro',
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.showErrorToast('خطایی رخ داده است.');
        console.error('خطا در آپلود:', errorData.error || 'خطایی رخ داده است.');
        return;
      }
      const result = await response.json();
      toast.showSuccessToast('آپلود با موفقیت انجام شد.');
      setIntroLink(result.videoKey);
      setOpenUploadIntroModal(false);
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
      console.error('خطای غیرمنتظره در آپلود:', error.message);
    }
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
        'آدرس فقط می‌تواند شامل حروف انگلیسی، اعداد و "-" باشد.',
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
      `/api/admin/validate-short-address?shortAddress=${encodeURIComponent(shortAddress)}`,
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
    }

    if (!shortDesc.trim() || shortDesc.length > 100) {
      errors.shortDesc = 'توضیح مختصر باید کمتر از ۱۰۰ کاراکتر باشد.';
    }

    if (!level) {
      errors.level = 'سطح دوره را مشخص کنید.';
    }

    if (!status) {
      errors.status = 'وضعیت دوره را مشخص کنید.';
    }

    if (!sessionsCount || isNaN(sessionsCount) || sessionsCount <= 0) {
      errors.sessionsCount =
        'تعداد جلسات باید یک عدد معتبر و بیشتر از صفر باشد.';
    }

    if (!time || isNaN(time) || time <= 0) {
      errors.time = 'مدت زمان باید یک عدد معتبر و بیشتر از صفر باشد.';
    }

    if (!firstDesc.trim()) {
      errors.firstDesc = 'توضیحات اولیه نمی‌تواند خالی باشد.';
    }

    if (!completeDesc.trim()) {
      errors.completeDesc = 'توضیحات کامل نمی‌تواند خالی باشد.';
    }

    if (shortAddress.length < 4) {
      errors.shortAddress = 'آدرس باید حداقل ۴ کاراکتر باشد.';
    }
    if (/\s|‌/.test(shortAddress)) {
      errors.shortAddress = 'استفاده از فاصله یا نیم فاصله مجاز نیست.';
    }

    if (/[^a-zA-Z0-9\\-]/.test(shortAddress)) {
      errors.shortAddress =
        'آدرس فقط می‌تواند شامل حروف انگلیسی، اعداد و "-" باشد.';
    }

    if (!/^[a-zA-Z0-9\\-]+$/.test(shortAddress)) {
      errors.shortAddress = 'آدرس باید فقط شامل حروف انگلیسی یا اعداد باشد.';
    }

    const coverRegex = /\.(jpg|jpeg|png)$/i;
    if (!coverRegex.test(coverLink)) {
      errors.coverLink = 'لینک کاور باید با فرمت .jpg، .jpeg یا .png باشد.';
    }
    const videoRegex = /\.m3u8$/i;
    if (!videoRegex.test(introLink)) {
      errors.introLink = 'لینک ویدیو باید با فرمت .m3u8 باشد.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
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

  const handleCreateCourse = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }
    setLoading(true);

    const payload = {
      title,
      subtitle: shortDesc,
      shortDescription: shortDesc,
      description: completeDesc,
      cover: coverLink,
      isHighPriority: highPriority,
      shortAddress,
      sessionCount: Number(sessionsCount),
      duration: Number(time),
      level,
      status,
      instructorId: 1, // Update with actual instructor ID
      introVideoUrl: introLink,
    };

    try {
      let response;
      if (courseToUpdate) {
        // Update course
        response = await fetch(
          `http://localhost:3000/api/admin/courses/${courseToUpdate.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        // Create course
        response = await fetch(
          'http://localhost:3000/api/admin/create-course',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );
      }

      if (response.ok) {
        await response.json();
        toast.showSuccessToast(
          courseToUpdate
            ? 'دوره با موفقیت به‌روزرسانی شد'
            : 'دوره با موفقیت ثبت شد',
        );
        router.replace('/a-panel/course');
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        toast.showErrorToast(errorText || 'خطای رخ داده');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h1 className='text-base font-semibold xs:text-xl'>ثبت دوره جدید</h1>
        <Button
          onClick={handleCreateCourse}
          shadow
          disable={loading}
          className='flex items-center justify-center'
        >
          {courseToUpdate ? 'به روزرسانی' : 'ثبت دوره'}
          {loading && (
            <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
          )}
        </Button>
      </div>
      <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <Input
          label='عنوان'
          placeholder='عنوان دوره را وارد کنید'
          value={title}
          onChange={setTitle}
          errorMessage={errorMessages.title}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />
        <Input
          label='توضیح مختصر'
          placeholder='توضیح مختصر در حد یک خط برای کارت ها'
          value={shortDesc}
          onChange={setShortDesc}
          errorMessage={errorMessages.shortDesc}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />
        <div className='relative'>
          <Input
            label='لینک کاور'
            placeholder='لینک کاور دوره را وارد کنید'
            value={coverLink}
            onChange={setCoverLink}
            errorMessage={errorMessages.coverLink}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <ActionButtonIcon
            icon={FiPlus}
            color='accent'
            className='absolute left-1 top-[38px]'
            onClick={() => setOpenUploadImageModal(true)}
          />
        </div>
        <div className='relative'>
          <Input
            label='لینک ویدیو معرفی'
            placeholder='لینک ویدیو معرفی دوره را وارد کنید'
            value={introLink}
            onChange={setIntroLink}
            errorMessage={errorMessages.introLink}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <ActionButtonIcon
            icon={FiPlus}
            color='accent'
            className='absolute left-1 top-[38px]'
            onClick={() => setOpenUploadIntroModal(true)}
          />
        </div>
        <DropDown
          label='سطح دوره'
          options={courseLevelOptions}
          placeholder='سطح دوره را مشخص کنید'
          value={level}
          onChange={setLevel}
          errorMessage={errorMessages.level}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />
        <DropDown
          label='وضعیت دوره'
          options={courseStatusOptions}
          placeholder='وضعیت دوره را مشخص کنید'
          value={status}
          onChange={setStatus}
          errorMessage={errorMessages.status}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />
        <Input
          label='تعداد جلسات'
          placeholder='تعداد جلسات را وارد کنید'
          value={sessionsCount}
          errorMessage={errorMessages.sessionsCount}
          onChange={setSessionsCount}
          className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
        />
        <div>
          <Input
            label='زمان (ثانیه)'
            placeholder='مدت زمان دوره را وارد کنید (برحسب ثانیه)'
            value={time}
            onChange={setTime}
            errorMessage={errorMessages.time}
            thousandSeparator={true}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <p className='mr-2 mt-1 font-faNa text-green sm:text-sm'>
            {time && getStringTime(time)}
          </p>
        </div>
        <div className='relative'>
          <Input
            label='لینک کوتاه'
            placeholder='لینک کوتاه را به انگلیسی وارد کنید'
            value={shortAddress}
            onChange={handleShortAddressChange}
            errorMessage={shortAddressError || errorMessages.shortAddress}
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
                className='absolute left-2 top-11 text-green'
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
        <Checkbox
          label='آیا این دوره با اولیت بالا است؟'
          value={highPriority}
          onChange={setHighPriority}
        />
        <div className='col-span-1 sm:col-span-2'>
          <TextArea
            label='توضیحات اولیه'
            placeholder='توضیحات اولیه دوره را وارد کنید'
            value={firstDesc}
            onChange={setFirstDesc}
            errorMessage={errorMessages.firstDesc}
            className='bg-surface-light text-sm placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark'
          />
        </div>
        <div className='col-span-1 sm:col-span-2'>
          <TextArea
            label='توضیحات کامل'
            placeholder='توضیحات کامل دوره را وارد کنید'
            value={completeDesc}
            onChange={setCompleteDesc}
            errorMessage={errorMessages.completeDesc}
            className='bg-surface-light text-sm placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark'
          />
        </div>
      </div>
      {openUploadImageModal && (
        <FileUploadModal
          title='آپلود کاور دوره'
          desc='برای آپلود تصویر کاور دوره فایل خود را در اینجا بکشید و رها کنید یا کلیک و انتخاب کنید.'
          onUpload={handleCoverImageUpload}
          onClose={() => setOpenUploadImageModal(false)}
        />
      )}
      {openUploadIntroModal && (
        <FileUploadModal
          title='آپلود ویدیو معرفی دوره'
          desc='برای آپلود ویدیو معرفی دوره فایل خود را در اینجا بکشید و رها کنید  یا کلیک و انتخاب کنید.'
          progressbar={true}
          onUpload={handleIntroVideoUpload}
          onClose={() => setOpenUploadIntroModal(false)}
        />
      )}
    </div>
  );
}

CreateCourseUpdateForm.propTypes = {
  courseToUpdate: PropTypes.object,
};

export default CreateCourseUpdateForm;
