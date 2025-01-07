/* eslint-disable no-undef */
'use client';
import React, { useState, useEffect } from 'react';
import Table from '@/components/Ui/Table/Table';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { MdAddToQueue } from 'react-icons/md';
import Switch from '@/components/Ui/Switch/Switch';
import Image from 'next/image';
import Modal from '@/components/modules/Modal/Modal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';

const CoursesTable = () => {
  const [courses, setCourses] = useState([]); // state برای ذخیره داده‌های دوره‌ها
  const [loading, setLoading] = useState(true); // state برای بارگذاری داده‌ها
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTempId, setDeleteTempId] = useState(null);
  const router = useRouter();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // فانکشن ریکوئست برای گرفتن داده‌ها از API
  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses`,
      ); // درخواست به API برای دریافت دوره‌ها
      const data = await response.json(); // تبدیل داده‌ها به فرمت JSON
      setCourses(data); // ذخیره داده‌ها در state
    } catch (error) {
      toast.showErrorToast('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false); // پایان بارگذاری
    }
  };

  // بارگذاری داده‌ها هنگام بارگذاری کامپوننت
  useEffect(() => {
    fetchCourses(); // فراخوانی فانکشن ریکوئست
  }, []);

  const toggleActiveStatus = async (id, row, currentStatus) => {
    row.activeStatus = !row.activeStatus;
    try {
      // به‌روزرسانی Optimistic
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === id
            ? { ...course, activeStatus: currentStatus }
            : course,
        ),
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${id}/active-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeStatus: currentStatus }), // ارسال مقدار جدید
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating activeStatus:', error);
      // بازگرداندن به حالت قبلی در صورت خطا
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === id
            ? { ...course, activeStatus: currentStatus }
            : course,
        ),
      );
    }
  };

  const handleShowDeleteModal = (id) => {
    setDeleteTempId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${deleteTempId}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setCourses(courses.filter((course) => course.id !== deleteTempId));
        setDeleteTempId(null);
        setShowDeleteModal(false);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns = [
    { key: 'id', label: 'شناسه' },
    { key: 'name', label: 'نام' },
    {
      key: 'cover',
      label: 'تصویر دوره',
      render: (_, row) => (
        <Image
          src={row.cover}
          alt={row.title}
          className='rounded'
          width={64}
          height={48}
        />
      ),
    },
    { key: 'price', label: 'قیمت' },
    { key: 'discount', label: '% تخفیف' },
    { key: 'termCount', label: 'تعداد ترم' },
    { key: 'sessionCount', label: 'تعداد جلسات' },
    { key: 'participants', label: 'تعداد شرکت‌کنندگان' },
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
            onClick={() => router.push(`/a-panel/course/${row.id}/update`)}
          />
          <ActionButtonIcon
            color='accent'
            icon={MdAddToQueue}
            onClick={() =>
              router.push(
                `/a-panel/course/${row.id}/term-session-manager?courseTitle=${encodeURIComponent(row.name)}`,
              )
            }
          />
        </div>
      ),
    },
    {
      key: 'active',
      label: 'فعال/غیر فعال',
      render: (_, row) => (
        <Switch
          className='mt-3 justify-center'
          size='small'
          checked={row.activeStatus} // استفاده از مقدار activeStatus از داده‌ها
          onChange={(newStatus) => toggleActiveStatus(row.id, row, newStatus)}
        />
      ),
    },
  ];

  // داده‌ها برای جدول (در اینجا از داده‌های API استفاده می‌کنیم)
  const data = courses.map((course) => ({
    id: course.id,
    name: course.title,
    cover: course.cover,
    price: course.totalPrice.toLocaleString('fa-IR'),
    discount: course.averageDiscount,
    termCount: course.termCount,
    sessionCount: course.sessionCount,
    participants: course.participants,
    activeStatus: course.activeStatus,
  }));

  // نمایش جدول در هنگام بارگذاری داده‌ها
  return (
    <div>
      <Table
        columns={columns}
        data={data}
        className='my-6 sm:my-10'
        loading={loading}
      />
      {showDeleteModal && (
        <Modal
          title='حذف دوره'
          desc='در صورت حذف دوره دیگر به اطلاعات آن دسترسی ندارید. با حذف دوره محتوای ویدیویی آن پاک نخواهد شد برای این کار باید از بخش مدیریت رسانه  اقدام کنید. آیا از حذف دوره مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteModal(false)}
          secondaryButtonClick={handleDeleteCourse}
        />
      )}
    </div>
  );
};

export default CoursesTable;
