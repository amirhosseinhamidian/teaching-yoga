import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Pagination from '@/components/Ui/Pagination/Pagination';
import { formatTime } from '@/utils/dateTimeHelper';
import AddEditTermModal from './AddEditTermModal';

const TermTable = ({
  className,
  terms,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onDeleteTerm,
  onUpdateTerm,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [termTemp, setTermTemp] = useState({});
  const [termTempId, setTermTempId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleShowDeleteModal = (termId) => {
    setTermTempId(termId);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    const deletePromise = fetch('/api/admin/terms-management', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Term-ID': termTempId, // ارسال شناسه ترم در هدر
      },
    });

    toast.handlePromiseToast(deletePromise, {
      loadingMessage: 'در حال حذف ترم...',
      successMessage: 'ترم با موفقیت حذف شد.',
      errorMessage: 'خطا در حذف ترم!',
    });

    try {
      const response = await deletePromise;

      // بررسی موفقیت‌آمیز بودن درخواست
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete the term');
      }

      // موفقیت در حذف ترم
      onDeleteTerm(termTempId);
    } catch (error) {
      // مدیریت خطا
      console.error('Error deleting term:', error.message);
    } finally {
      setShowDeleteModal(false); // بستن مودال حذف
    }
  };

  const handleShowUpdateModal = (term) => {
    setTermTemp(term);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = (updatedTerm) => {
    onUpdateTerm(updatedTerm);
    setShowUpdateModal(false);
    setTermTemp({});
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'name',
      minWidth: '120px',
      label: 'عنوان ترم',
    },
    {
      key: 'duration',
      label: 'مدت ترم',
      render: (_, row) => <span>{formatTime(row.duration)}</span>,
    },
    {
      key: 'courses',
      label: 'دوره‌ها',
      minWidth: '180px',
      render: (courses) => (
        <div className='whitespace-pre-wrap'>
          {courses && courses.length > 0
            ? courses.length > 1
              ? courses
                  .map((course, index) => `${index + 1}. ${course.title}`)
                  .join('\n')
              : courses[0].title // نمایش بدون شماره برای تنها یک دوره
            : 'نامشخص'}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'مبلغ (تومان)',
      render: (price) =>
        price === 0 ? 'رایگان' : price.toLocaleString('fa-IR'),
    },
    {
      key: 'discount',
      label: 'تخفیف (درصد)',
    },
    {
      key: 'actions',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleShowDeleteModal(row.id)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => handleShowUpdateModal(row)}
          />
        </div>
      ),
    },
  ];

  const data = terms.map((term, index) => ({
    number: index + 1 + (page - 1) * 10,
    name: term.name,
    subtitle: term.subtitle,
    duration: term.duration,
    price: term.price,
    discount: term.discount,
    courses: term.courses,
    updatedAt: term.updatedAt,
    id: term.id,
  }));
  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={isLoading}
        empty={terms.length === 0}
        emptyText='ترمی تا کنون ثبت نشده است.'
      />
      {terms.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showDeleteModal && (
        <Modal
          title='حذف ترم'
          desc='با حذف ترم ، این ترم از تما دوره هایی که ترم به آن متصل است حذف خواهد شد. همچنین این ترم از دوره هایی که کاربر خریداری کرده و یا در سبد خرید خود دارد حذف خواهد شد. آیا از حذف ترم مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setShowDeleteModal(false);
            setTermTempId(null);
          }}
          secondaryButtonClick={handleDeleteCourse}
        />
      )}
      {showUpdateModal && (
        <AddEditTermModal
          onClose={() => {
            setShowUpdateModal(false);
            setTermTemp({});
          }}
          onSuccess={(updatedTerm) => handleUpdateSuccess(updatedTerm)}
          term={termTemp}
        />
      )}
    </div>
  );
};

TermTable.propTypes = {
  className: PropTypes.string,
  terms: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onDeleteTerm: PropTypes.func.isRequired,
  onUpdateTerm: PropTypes.func.isRequired,
};

export default TermTable;
