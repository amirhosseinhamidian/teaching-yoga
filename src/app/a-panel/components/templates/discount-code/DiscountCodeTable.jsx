'use client';
/* eslint-disable no-undef */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';
import Switch from '@/components/Ui/Switch/Switch';
import AddEditDiscountCodeModal from '../../modules/AddEditDiscountCodeModal/AddEditDiscountCodeModal';

const DiscountCodeTable = ({
  className,
  discountCodes,
  setDiscountCodes,
  page,
  totalPages,
  isLoading,
  courseOptions,
  onPageChange,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [discountCodeTempId, setDiscountCodeTempId] = useState(null);
  const [showDiscountCodeDeleteModal, setShowDiscountCodeDeleteModal] =
    useState(false);
  const [showEditDiscountCodeModal, setShowEditDiscountCodeModal] =
    useState(null);
  const [discountCodeTemp, setDiscountCodeTemp] = useState({});

  const handleDeleteDiscountCodeModal = (id) => {
    setDiscountCodeTempId(id);
    setShowDiscountCodeDeleteModal(true);
  };

  const handleDeleteDiscountCode = async () => {
    try {
      toast.showLoadingToast('در حال حذف کد تخفیف...', {
        duration: 1500,
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discount-code?id=${discountCodeTempId}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setDiscountCodes((prev) =>
          prev.filter((discountCode) => discountCode.id !== discountCodeTempId),
        );
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDiscountCodeTempId(null);
      setShowDiscountCodeDeleteModal(false);
    }
  };

  const toggleActiveStatus = async (row, currentStatus) => {
    if (row.expiryDate && new Date(row.expiryDate) < new Date()) {
      toast.showErrorToast(
        'تاریخ انقضا کد تخفیف گذشته و امکان فعال سازی آن وجود ندارد!',
      );
      return;
    }
    // تغییر مقدار در ردیف انتخاب‌شده
    const updatedStatus = currentStatus;

    try {
      // به‌روزرسانی سریع در UI (Optimistic Update)
      setDiscountCodes((prev) =>
        prev.map((discountCode) =>
          discountCode.id === row.id
            ? { ...discountCode, isActive: updatedStatus }
            : discountCode,
        ),
      );

      // ارسال درخواست به سرور
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discount-code/active-status?id=${row.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: updatedStatus }), // ارسال مقدار جدید
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating activeStatus:', error);

      // بازگرداندن به مقدار قبلی در صورت خطا (Rollback)
      setDiscountCodes((prev) =>
        prev.map((discountCode) =>
          discountCode.id === row.id
            ? { ...discountCode, isActive: !updatedStatus }
            : discountCode,
        ),
      );
    }
  };

  const handleUpdateDiscountCode = (updatedDiscountCode) => {
    setDiscountCodes((prev) =>
      prev.map((discountCode) =>
        discountCode.id === updatedDiscountCode.id
          ? {
              ...discountCode,
              ...updatedDiscountCode,
            }
          : discountCode,
      ),
    );
    setShowEditDiscountCodeModal(false);
    setDiscountCodeTemp(null);
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'title',
      label: 'عنوان',
      minWidth: '80px',
    },
    {
      key: 'code',
      label: 'کد',
      minWidth: '80px',
    },
    {
      key: 'discountPercent',
      label: 'درصد تخفیف',
      render: (_, row) => <p className='font-faNa'>{row.discountPercent}%</p>,
    },
    {
      key: 'maxDiscountAmount',
      label: 'سقف (تومان)',
      render: (_, row) =>
        row.maxDiscountAmount
          ? row.maxDiscountAmount.toLocaleString('fa-IR')
          : '-',
    },
    {
      key: 'usageCount',
      label: 'باقی مانده',
      render: (_, row) =>
        row.usageLimit ? (
          <p className='font-faNa'>{row.usageLimit - row.usageCount}</p>
        ) : (
          '-'
        ),
    },

    {
      key: 'expiryDate',
      label: 'تاریخ ایجاد',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getShamsiDate(row.expiryDate)}`}</p>
      ),
    },

    {
      key: 'actions',
      minWidth: '80px',
      label: 'عملیات',
      // eslint-disable-next-line no-unused-vars
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleDeleteDiscountCodeModal(row.id)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => {
              setShowEditDiscountCodeModal(true);
              setDiscountCodeTemp(row);
            }}
          />
        </div>
      ),
    },

    {
      key: 'active',
      minWidth: '80px',
      label: 'فعال/غیر فعال',
      render: (_, row) => (
        <Switch
          className='mt-3 justify-center'
          size='small'
          checked={row.isActive}
          onChange={(newStatus) => toggleActiveStatus(row, newStatus)}
        />
      ),
    },
  ];

  const data = discountCodes?.map((discountCode, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: discountCode.id,
    title: discountCode.title,
    code: discountCode.code,
    discountPercent: discountCode.discountPercent,
    maxDiscountAmount: discountCode.maxDiscountAmount,
    usageLimit: discountCode.usageLimit,
    usageCount: discountCode.usageCount,
    minPurchaseAmount: discountCode.minPurchaseAmount,
    expiryDate: discountCode.expiryDate,
    description: discountCode.description,
    courseId: discountCode.courseId,
    course: discountCode.course,
    isActive: discountCode.isActive,
    createdAt: discountCode.createdAt,
    updatedAt: discountCode.updatedAt,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={discountCodes.length === 0}
        emptyText='هیچ کد تخفیفی وجود ندارد.'
      />
      {discountCodes.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showDiscountCodeDeleteModal && (
        <Modal
          title='حذف کد تخفیف'
          desc='در صورت حذف کد تخفیف دیگر به اطلاعات آن دسترسی ندارید. آیا از حذف این جلسه مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setDiscountCodeTempId(null);
            setShowDiscountCodeDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteDiscountCode}
        />
      )}
      {showEditDiscountCodeModal && (
        <AddEditDiscountCodeModal
          onClose={() => {
            setShowEditDiscountCodeModal(false);
            setDiscountCodeTemp(null);
          }}
          onSuccess={handleUpdateDiscountCode}
          discountCode={discountCodeTemp}
          courseOptions={courseOptions}
        />
      )}
    </div>
  );
};

DiscountCodeTable.propTypes = {
  className: PropTypes.string,
  discountCodes: PropTypes.array.isRequired,
  setDiscountCodes: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  courseOptions: PropTypes.array.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default DiscountCodeTable;
