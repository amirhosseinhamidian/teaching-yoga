'use client';
import React, { useEffect, useState } from 'react';
import HeadAction from './HeadAction';
import SearchFilterDiscountCode from './SearchFilterDiscountCode';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DiscountCodeTable from './DiscountCodeTable';

const DiscountCodeTableSection = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(true);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filter, setFilter] = useState(undefined);
  const [courseOptions, setCourseOptions] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState(null);

  const fetchDiscountCodes = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/discount-code?&page=${page}&perPage=10${filter && `&isActive=${filter}`}${search && `&search=${search}`}`
      );

      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseOptions = async () => {
    try {
      const response = await fetch(`/api/admin/courses/filter`);
      if (!response.ok) {
        throw new Error('Error to fetch courses options!');
      }
      const data = await response.json();
      setCourseOptions(data.courseOptions);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ NEW: گرفتن دسته‌بندی‌های محصولات برای scope = PRODUCT_CATEGORY
  const fetchCategoryOptions = async () => {
    try {
      const response = await fetch(`/api/admin/product-categories/filter`);
      if (!response.ok) throw new Error('Error to fetch categories options!');
      const data = await response.json();
      setCategoryOptions(data.categoryOptions);
    } catch (error) {
      console.error(error);
    }
  };

  // اجرای جستجو با debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchDebounce(searchText); // به‌روزرسانی وضعیت جستجو پس از توقف تایپ
      setPage(1); // بازگشت به صفحه اول در صورت تغییر متن جستجو
    }, 2000);

    return () => clearTimeout(delayDebounceFn); // پاک‌سازی تایمر قبلی
  }, [searchText]);

  // فراخوانی API هنگام تغییر صفحه یا جستجو
  useEffect(() => {
    fetchDiscountCodes(page, searchDebounce);
  }, [page, searchDebounce, filter]);

  useEffect(() => {
    fetchCourseOptions();
    fetchCategoryOptions();
  }, []);

  const addDiscountCodeSuccessfully = (newDiscountCode) => {
    setDiscountCodes((prev) => [newDiscountCode, ...prev]);
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      <HeadAction
        courseOptions={courseOptions}
        categoryOptions={categoryOptions}
        addDiscountCodeSuccessfully={(newDiscountCode) =>
          addDiscountCodeSuccessfully(newDiscountCode)
        }
      />
      <div className='mt-6 sm:mt-10'>
        <SearchFilterDiscountCode
          className='mb-3 sm:mb-6'
          searchText={searchText}
          setSearchText={setSearchText}
          filter={filter}
          setFilter={setFilter}
        />
        <DiscountCodeTable
          discountCodes={discountCodes}
          setDiscountCodes={setDiscountCodes}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          page={page}
          totalPages={totalPages}
          courseOptions={courseOptions}
          categoryOptions={categoryOptions}
          updateHandle={(updateDiscountCode) =>
            addDiscountCodeSuccessfully(updateDiscountCode)
          }
        />
      </div>
    </div>
  );
};

export default DiscountCodeTableSection;
