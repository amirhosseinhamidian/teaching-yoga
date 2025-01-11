/* eslint-disable no-undef */
'use client';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import React, { useEffect, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import TermTable from '../components/templates/term/TermTable';
import AddEditTermModal from '../components/templates/term/AddEditTermModal';

function TermPage() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [courseSelected, setCourseSelected] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateTermModal, setShowCreateTermModal] = useState(false);

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

  const fetchTerms = async (page, courseId = -1) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms-management?page=${page}&perPage=10&courseId=${courseId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setTerms(data.terms);
        setTotalPages(data.pagination.totalPages);
        setPage(page); // مقدار صفحه را فقط بعد از موفقیت تنظیم می‌کنیم
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms(page);
  }, [page]);

  const handleChangeCourse = async (newCourseSelected) => {
    setCourseSelected(newCourseSelected);
    fetchTerms(1, newCourseSelected);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleDeleteTerm = (termId) => {
    setTerms((prevTerms) => prevTerms.filter((term) => term.id !== termId));
  };

  const handleUpdateTerm = (updatedTerm) => {
    setTerms((prevTerms) =>
      prevTerms.map((term) => {
        if (term.id === updatedTerm.id) {
          const courses = term.courses;
          return { ...updatedTerm, courses };
        }
        return term;
      }),
    );
  };

  const handleCreateTerm = (newTermData) => {
    const newTerm = {
      id: newTermData.id,
      name: newTermData.name,
      subtitle: newTermData.subtitle || '',
      duration: newTermData.duration,
      price: newTermData.price,
      discount: newTermData.discount,
      courses: [],
      createAt: newTermData.createAt,
      updatedAt: newTermData.updatedAt,
    };

    // بروزرسانی لیست ترم‌ها
    setTerms((prevTerms) => [newTerm, ...prevTerms]);
    setShowCreateTermModal(false);
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <DropDown
          onChange={handleChangeCourse}
          value={courseSelected}
          options={courseOptions}
          placeholder='فیلتر کردن براساس دوره ها'
        />
        <Button shadow onClick={() => setShowCreateTermModal(true)}>
          ثبت ترم جدید
        </Button>
      </div>

      <TermTable
        isLoading={isLoading}
        onPageChange={handlePageChange}
        page={page}
        terms={terms}
        totalPages={totalPages}
        onDeleteTerm={(termId) => handleDeleteTerm(termId)}
        onUpdateTerm={(term) => handleUpdateTerm(term)}
      />
      {showCreateTermModal && (
        <AddEditTermModal
          onClose={() => setShowCreateTermModal(false)}
          onSuccess={(data) => handleCreateTerm(data)}
        />
      )}
    </div>
  );
}

export default TermPage;
