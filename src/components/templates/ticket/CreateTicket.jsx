'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight,
  HiOutlineInformationCircle,
  HiOutlinePaperAirplane,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const CreateTicket = () => {
  const { isDark } = useTheme();

  const toast = createToastHandler(isDark);

  const router = useRouter();

  const [courseSelected, setCourseSelected] = useState(null);

  const [courseOptions, setCourseOptions] = useState([]);

  const [subject, setSubject] = useState('');

  const [ticketText, setTicketText] = useState('');

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const [errorMessages, setErrorMessages] = useState({
    subject: '',
    description: '',
  });

  /*
  |--------------------------------------------------------------------------
  | Courses
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/admin/courses-option');

        const data = await response.json();

        const options = data.map((course) => ({
          label: course.title,

          value: course.id,
        }));

        setCourseOptions([
          {
            label: 'همه دوره‌ها',

            value: -1,
          },

          ...options,
        ]);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validateInputs = () => {
    const errors = {};

    if (!subject.trim()) {
      errors.subject = 'موضوع تیکت را مشخص کنید.';
    }

    if (subject.length < 3) {
      errors.subject = 'موضوع تیکت حداقل باید سه کارکتر باشد.';
    }

    if (!ticketText.trim()) {
      errors.description = 'متن تیکت را بنویسید.';
    }

    if (ticketText.length < 10) {
      errors.description = 'متن تیکت باید بیش از ۱۰ کارکتر باشد.';
    }

    setErrorMessages(errors);

    return Object.keys(errors).length === 0;
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submitTicket = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('فرم تیکت را به درستی پر کنید.');

      return;
    }

    try {
      setIsSubmitLoading(true);

      const payload = {
        title: subject,

        description: ticketText,

        courseId:
          courseSelected && courseSelected !== -1 ? courseSelected : null,
      };

      const response = await fetch('/api/ticket', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      toast.showSuccessToast('تیکت با موفقیت ثبت شد!');

      setSubject('');
      setTicketText('');
      setCourseSelected(null);

      router.replace('/profile?active=4');
    } catch (error) {
      console.error('Error submitting ticket:', error);

      toast.showErrorToast('خطایی در ثبت تیکت رخ داد. لطفاً بعدا امتحان کنید.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='پشتیبانی سمانه یوگا'
          title='ایجاد یک'
          highlight='تیکت جدید'
          description='موضوع درخواست خود را با جزئیات برای تیم پشتیبانی ارسال کنید تا بتوانیم دقیق‌تر و سریع‌تر راهنمایی‌تان کنیم.'
          visualIcon={HiOutlineChatBubbleLeftRight}
          variant='compact'
        />

        <div className='mx-auto mt-6 max-w-4xl'>
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative overflow-hidden'
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
            />

            <div className='relative z-10'>
              {/* Header */}
              <div className='flex items-start gap-3 border-b border-black/5 px-5 py-5 sm:px-6 dark:border-white/10'>
                <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                  <HiOutlineQuestionMarkCircle size={22} />
                </span>

                <div>
                  <p className='text-[10px] font-bold text-secondary'>
                    جزئیات درخواست
                  </p>

                  <h2 className='mt-0.5 text-base font-black text-text-light dark:text-text-dark'>
                    اطلاعات تیکت
                  </h2>

                  <p className='mt-1 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
                    موضوع و توضیحات درخواست را تا حد امکان دقیق وارد کنید.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className='space-y-6 px-5 py-6 sm:px-6'>
                <DropDown
                  onChange={setCourseSelected}
                  value={courseSelected}
                  options={courseOptions}
                  placeholder='انتخاب دوره (اختیاری)'
                  label='در صورتی که موضوع تیکت با دوره خاصی مرتبط است، دوره را انتخاب کنید. (اختیاری)'
                />

                <Input
                  placeholder='موضوع تیکت را بنویسید'
                  label='موضوع تیکت'
                  maxLength={100}
                  fullWidth
                  value={subject}
                  onChange={setSubject}
                  errorMessage={errorMessages.subject}
                  className='bg-surface-light dark:bg-surface-dark'
                />

                <TextEditor
                  fullWidth
                  label='متن تیکت'
                  placeholder='متن تیکت را بنویسید'
                  value={ticketText}
                  onChange={setTicketText}
                  maxLength={2000}
                  errorMessage={errorMessages.description}
                  className='bg-surface-light dark:bg-surface-dark'
                  toolbarItems={[
                    ['bold', 'italic', 'underline', 'strike'],
                    [
                      {
                        align: [],
                      },
                      {
                        direction: 'rtl',
                      },
                    ],
                    [
                      {
                        list: 'ordered',
                      },
                      {
                        list: 'bullet',
                      },
                    ],
                    [
                      {
                        indent: '-1',
                      },
                      {
                        indent: '+1',
                      },
                    ],
                    ['link'],
                    ['clean'],
                  ]}
                />

                {/* Guide */}
                <div className='flex items-start gap-3 rounded-2xl border border-secondary/10 bg-secondary/[0.045] p-4'>
                  <HiOutlineInformationCircle
                    size={19}
                    className='mt-0.5 shrink-0 text-secondary'
                  />

                  <p className='text-[10px] leading-6 text-subtext-light sm:text-xs sm:leading-7 dark:text-subtext-dark'>
                    برای دریافت پاسخ دقیق‌تر، اطلاعات مهم مثل نام دوره، مشکل
                    ایجادشده و جزئیات مرتبط را در متن تیکت بنویسید.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col-reverse gap-2 border-t border-black/5 bg-background-light/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-white/10 dark:bg-background-dark/15'>
                <SiteButton
                  href='/profile?active=4'
                  variant='outline'
                  size='md'
                  startIcon={HiOutlineArrowRight}
                >
                  بازگشت
                </SiteButton>

                <SiteButton
                  type='button'
                  variant='primary'
                  size='md'
                  startIcon={HiOutlinePaperAirplane}
                  disabled={isSubmitLoading}
                  onClick={submitTicket}
                >
                  {isSubmitLoading ? 'در حال ثبت...' : 'ثبت تیکت'}
                </SiteButton>
              </div>
            </div>
          </SiteCard>
        </div>
      </div>
    </main>
  );
};

export default CreateTicket;
