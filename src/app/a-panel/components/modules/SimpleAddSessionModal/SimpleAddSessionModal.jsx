/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { getStringTime } from '@/utils/dateTimeHelper';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import DropDown from '@/components/Ui/DropDown/DropDwon';

const SimpleAddSessionModal = ({ onClose, onSuccess }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);

  // فرم ساخت جلسه
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [sessionType, setSessionType] = useState(null);

  // انتخاب چندین ترم
  const [termOptions, setTermOptions] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState([]);

  const sessionTypeOptions = [
    { value: 'VIDEO', label: 'ویدیو' },
    { value: 'AUDIO', label: 'صدا' },
  ];

  const [errors, setErrors] = useState({});

  // ---------------------------------
  // لود کل ترم‌ها
  // ---------------------------------
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms`
        );
        const data = await resp.json();

        setTermOptions(
          data.map((term) => ({
            value: term.id,
            label: `${term.name} - ${term.sessionCount} جلسه`,
          }))
        );
      } catch (e) {
        toast.showErrorToast('خطا در دریافت لیست ترم‌ها');
      }
    };

    fetchTerms();
  }, []);

  // ---------------------------------
  // انتخاب یک ترم از دراپ‌دان
  // ---------------------------------
  const handleSelectTerm = (termId) => {
    const term = termOptions.find((t) => t.value === termId);

    if (!term) return;

    // جلوگیری از انتخاب دوباره
    if (selectedTerms.some((t) => t.value === termId)) return;

    setSelectedTerms((prev) => [...prev, term]);
  };

  // ---------------------------------
  // حذف ترم انتخاب شده
  // ---------------------------------
  const handleRemoveTerm = (termId) => {
    setSelectedTerms((prev) => prev.filter((t) => t.value !== termId));
  };

  // ---------------------------------
  // اعتبارسنجی
  // ---------------------------------
  const validateInputs = () => {
    const e = {};

    if (!name.trim()) e.name = 'عنوان جلسه الزامی است.';
    if (!duration || isNaN(duration) || Number(duration) <= 0)
      e.duration = 'مدت زمان معتبر نیست.';
    if (!sessionType) e.sessionType = 'نوع محتوا را انتخاب کنید.';
    if (selectedTerms.length === 0) e.terms = 'حداقل یک ترم انتخاب کنید.';

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  // ---------------------------------
  // ساخت جلسه
  // ---------------------------------
  const handleCreateSession = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('لطفاً فرم را کامل کنید');
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            duration: Number(duration),
            type: sessionType,
          }),
        }
      );

      if (!resp.ok) throw new Error('خطا در ساخت جلسه');

      const createdSession = await resp.json();

      // 2) اتصال جلسه به ترم‌ها
      for (const term of selectedTerms) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${term.value}/sessions/attach`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: createdSession.id }),
          }
        );
      }

      // ⛔ newSession ناقص است، باید نسخه کامل را fetch کنیم
      const fullResp = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sessions/${createdSession.id}`
      );

      const fullSession = await fullResp.json();

      toast.showSuccessToast('جلسه با موفقیت ساخته و متصل شد');

      // حالا fullSession شامل sessionTerms و term است
      onSuccess(fullSession);
      onClose();
    } catch (err) {
      toast.showErrorToast('خطا در ساخت جلسه');
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------
  // UI
  // ---------------------------------
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='relative w-3/4 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        {/* Header */}
        <div className='flex items-center justify-between border-b pb-3'>
          <h3 className='text-lg font-semibold'>افزودن جلسه جدید</h3>
          <button onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className='my-6 border-b pb-6'>
          <h4 className='mb-3 text-sm font-semibold'>اتصال به ترم‌ها</h4>

          <DropDown
            options={termOptions}
            label='انتخاب ترم'
            onChange={handleSelectTerm}
            fullWidth
            errorMessage={errors.terms}
            placeholder='ترم مورد نظر را انتخاب کنید'
            optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
          />

          {/* لیست ترم‌های انتخاب‌شده */}
          <div className='mt-4 flex flex-wrap gap-4'>
            {selectedTerms.map((term) => (
              <div
                key={term.value}
                className='flex w-fit items-center gap-4 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-700'
              >
                <span>{term.label}</span>
                <button
                  onClick={() => handleRemoveTerm(term.value)}
                  className='text-red-500'
                >
                  <IoClose size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* فرم ساخت جلسه */}
        <div className='mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='عنوان جلسه'
            value={name}
            onChange={setName}
            errorMessage={errors.name}
          />

          <div>
            <Input
              label='زمان (ثانیه)'
              value={duration}
              onChange={setDuration}
              errorMessage={errors.duration}
            />
            {duration && (
              <span className='text-green-light dark:text-green-dark font-faNa'>
                {getStringTime(duration)}
              </span>
            )}
          </div>

          <DropDown
            options={sessionTypeOptions}
            label='نوع محتوا'
            value={sessionType}
            onChange={setSessionType}
            errorMessage={errors.sessionType}
            fullWidth
            placeholder='نوع محتوا مورد نظر را انتخاب کنید'
          />
        </div>

        {/* دکمه ثبت */}
        <Button isLoading={isLoading} onClick={handleCreateSession}>
          ثبت جلسه
        </Button>
      </div>
    </div>
  );
};

SimpleAddSessionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default SimpleAddSessionModal;
