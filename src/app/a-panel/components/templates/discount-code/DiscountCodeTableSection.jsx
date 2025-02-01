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

  const fetchDiscountCodes = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/discount-code?&page=${page}&perPage=10${filter && `&isActive=${filter}`}${search && `&search=${search}`}`,
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

  const addDiscountCodeSuccessfully = (newDiscountCode) => {
    setDiscountCodes((prev) => [newDiscountCode, ...prev]);
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      <HeadAction
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
          updateHandle={(updateDiscountCode) =>
            addDiscountCodeSuccessfully(updateDiscountCode)
          }
        />
      </div>
    </div>
  );
};

export default DiscountCodeTableSection;
