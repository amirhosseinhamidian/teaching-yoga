/* eslint-disable no-undef */
'use client';
import Accordion from '@/components/Ui/Accordion/Accordion';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import Button from '@/components/Ui/Button/Button';
import { COURSE, GENERAL, ONLINE_CLASS } from '@/constants/faqCategories';
import React, { useEffect, useState } from 'react';
import { LuTrash, LuPencil } from 'react-icons/lu';
import AddEditFAQModal from './AddEditFAQModal';
import Modal from '@/components/modules/Modal/Modal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const FAQsSection = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [faqsData, setFaqsData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [faqTemp, setFaqTemp] = useState(null);

  const fetchFAQsData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      const faqs = await response.json();
      setFaqsData(faqs);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFAQsData();
  }, []);

  const handleShowDeleteFAQModal = (faq) => {
    setFaqTemp(faq);
    setShowDeleteModal(true);
  };

  const handleShowEditFAQModal = (faq) => {
    setFaqTemp(faq);
    setShowEditModal(true);
  };

  const handleSuccessAdd = (newFaq) => {
    setFaqsData((prevFaqs) => [newFaq, ...prevFaqs]);
    setShowAddModal(false);
  };

  const handleSuccessEdit = (updatedFaq) => {
    setFaqsData((prevFaqs) =>
      prevFaqs.map((faq) =>
        faq.id === updatedFaq.id ? { ...faq, ...updatedFaq } : faq,
      ),
    );
    setShowEditModal(false);
  };

  const handleDeleteQuestion = async () => {
    try {
      toast.showLoadingToast('در حال حذف سوال', { duration: 1000 });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faqs`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: faqTemp.id }),
        },
      );
      if (!response.ok) {
        throw new Error('Error Delete faq!');
      }
      toast.showSuccessToast('سوال با موفقیت حذف شد.');
      setFaqsData((prevFaqs) =>
        prevFaqs.filter((faq) => faq.id !== faqTemp.id),
      );
    } catch (error) {
      toast.showErrorToast('خطا در هنگام حدف سوال');
      console.error(error);
    } finally {
      setFaqTemp(null);
      setShowDeleteModal(false);
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case GENERAL:
        return 'عمومی';
      case COURSE:
        return 'دوره ها';
      case ONLINE_CLASS:
        return 'کلاس آنلاین';
      default:
        'عمومی';
    }
  };
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h3 className='mb-2 mr-4 block text-lg font-semibold md:text-2xl'>
          سوالات متداول
        </h3>
        <Button
          shadow
          className='text-xs sm:text-sm'
          onClick={() => setShowAddModal(true)}
        >
          افزودن
        </Button>
      </div>
      <div className='mb-8 mr-4 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
        <p>
          ** عمومی : در بخش های عمومی سایت مثل ارتباط با ما، درباره سایت استفاده
          می شود.
        </p>
        <p>** دوره ها : در صفحه جزییات دوره ها استفاده می شود.</p>
      </div>
      {faqsData &&
        faqsData.map((faq) => (
          <Accordion
            key={faq.id}
            title={faq.question}
            subtitle={getCategoryText(faq.category)}
            content={faq.answer}
            className='mb-4 bg-surface-light dark:bg-surface-dark'
            actionLeftContent={
              <div className='flex gap-2'>
                <ActionButtonIcon
                  color='red'
                  icon={LuTrash}
                  onClick={() => handleShowDeleteFAQModal(faq)}
                />
                <ActionButtonIcon
                  color='blue'
                  icon={LuPencil}
                  onClick={() => handleShowEditFAQModal(faq)}
                />
              </div>
            }
          />
        ))}
      {showAddModal && (
        <AddEditFAQModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newFaq) => handleSuccessAdd(newFaq)}
        />
      )}
      {showEditModal && (
        <AddEditFAQModal
          onClose={() => setShowEditModal(false)}
          onSuccess={(newFaq) => handleSuccessEdit(newFaq)}
          faq={faqTemp}
        />
      )}
      {showDeleteModal && (
        <Modal
          title='حذف سوال'
          icon={LuTrash}
          iconSize={32}
          desc='با حذف سوال دسترسی به آن امکان پذیر نیست. آیا از حذف مطمئن هستید؟'
          primaryButtonText='لغو'
          secondaryButtonText='حذف'
          primaryButtonClick={() => {
            setShowDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteQuestion}
        />
      )}
    </div>
  );
};

export default FAQsSection;
