'use client';
import React, { useEffect, useState } from 'react';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';

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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/admin/courses-option');
        const data = await response.json();

        const options = data.map((course) => ({
          label: course.title,
          value: course.id,
        }));
        setCourseOptions([{ label: 'همه دوره‌ها', value: -1 }, ...options]);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  const validateInputs = () => {
    let errors = {};

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

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const submitTicket = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('فرم تیکت را به درستی پر کنید.');
      return;
    }
    try {
      // جلوگیری از چندین کلیک روی دکمه ثبت
      setIsSubmitLoading(true);

      // آماده‌سازی داده‌های فرم
      const payload = {
        title: subject,
        description: ticketText,
        courseId:
          courseSelected && courseSelected !== -1 ? courseSelected : null,
      };

      // ارسال درخواست به API
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

  return (
    <div className='container mx-auto w-full py-4 md:w-2/3'>
      <PageTitle>تیکت جدید</PageTitle>
      <div className='flex flex-col gap-6'>
        <DropDown
          onChange={setCourseSelected}
          value={courseSelected}
          options={courseOptions}
          placeholder='انتخاب دوره (اختیاری)'
          label='در صورتی که موضوع تیکت با دوره خاصی مرتبط هست ، دوره را انتخاب کنید. (اختیاری)'
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
            [{ align: [] }, { direction: 'rtl' }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            ['link'],
            ['clean'],
          ]}
        />
        <div className='mb-10 flex w-full items-center justify-center'>
          <Button
            shadow
            className='w-full sm:w-1/2 md:w-1/3 lg:w-1/4'
            isLoading={isSubmitLoading}
            onClick={submitTicket}
          >
            ثبت تیکت
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
