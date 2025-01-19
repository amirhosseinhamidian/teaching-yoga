/* eslint-disable no-undef */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import TextArea from '@/components/Ui/TextArea/TextArea';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { COURSE, GENERAL } from '@/constants/faqCategories';
import Button from '@/components/Ui/Button/Button';

const AddEditFAQModal = ({ onClose, onSuccess, faq }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || null);
  const [errorMessages, setErrorMessages] = useState({
    question: '',
    answer: '',
    category: '',
  });

  const categoryOptions = [
    { label: 'عمومی', value: GENERAL },
    { label: 'دوره', value: COURSE },
  ];

  const validateInputs = () => {
    let errors = {};

    if (!question.trim()) {
      errors.question = 'سوال نمی‌تواند خالی باشد.';
    }

    if (question.trim().length < 8) {
      errors.question = 'سوال نمی‌تواند کمتر از ۸ کارکتر باشد.';
    }

    if (!answer.trim()) {
      errors.answer = 'پاسخ نمی‌تواند خالی باشد.';
    }

    if (answer.trim().length < 15) {
      errors.answer = 'پاسخ نمی‌تواند کمتر از ۱۵ کارکتر باشد.';
    }

    if (!category) {
      errors.category = 'لطفا یک دسته برای سوال انتخاب کنید.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید.');
      return;
    }
    try {
      setIsLoading(true);
      const method = faq?.id ? 'PUT' : 'POST';
      const payload = {
        id: faq?.id,
        question,
        answer,
        category,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs`,
        {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error('Error To submit faqs form!');
      }
      toast.showSuccessToast(
        faq ? 'سوال با موفقیت بروز شد.' : 'سوال با موفقیت ثبت شد.',
      );
      const data = await response.json();
      onSuccess(data);
    } catch (error) {
      toast.showErrorToast('خطا در ثبت سوال!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative max-h-screen w-2/3 overflow-y-auto rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {faq ? 'ویرایش سوال' : 'افزودن سوال'}
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div className='my-6 flex flex-col gap-6'>
          <div className='w-full lg:w-1/2'>
            <DropDown
              fullWidth
              label='دسته بندی'
              options={categoryOptions}
              placeholder='یکی از دسته بندی ها را انتخاب کنید'
              value={category}
              onChange={setCategory}
              errorMessage={errorMessages.category}
              className='px-4'
            />
          </div>
          <TextArea
            fullWidth
            label='سوال'
            placeholder='سوال را در این قسمت بنویسید'
            value={question}
            onChange={setQuestion}
            errorMessage={errorMessages.question}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />
          <TextArea
            fullWidth
            label='پاسخ'
            placeholder='پاسخ سوال را در این قسمت بنویسید'
            value={answer}
            onChange={setAnswer}
            errorMessage={errorMessages.answer}
            className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
          />

          <div>
            <Button shadow isLoading={isLoading} onClick={handleSubmit}>
              {faq ? 'بروزرسانی' : 'ثبت'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

AddEditFAQModal.propTypes = {
  faq: PropTypes.object,
  courseId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default AddEditFAQModal;
