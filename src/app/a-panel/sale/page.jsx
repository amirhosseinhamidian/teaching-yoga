'use client';
/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import SalesSummarySection from '../components/templates/sale/SalesSummarySection';
import LineChartComponent from '@/components/Ui/LineChart/LineChartComponent';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import SalesTable from '../components/templates/sale/SalesTable';
import { getShamsiDate } from '@/utils/dateTimeHelper';

function SalePage() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [saleInfo, setSaleInfo] = useState({});

  const fetchSaleInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sales/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setSaleInfo(data);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      setIsLoadingChart(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sales/daily-revenue`,
      );

      if (response.ok) {
        const data = await response.json();
        // اعمال تغییرات روی دیتا
        const transformedData = data.map((item) => ({
          ...item,
          revenue: item.revenue / 1000000, // حذف ۶ صفر از درآمد
          date: getShamsiDate(item.date), // تبدیل تاریخ به شمسی
        }));

        setChartData(transformedData);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در نمودار');
    } finally {
      setIsLoadingChart(false);
    }
  };

  const fetchSales = async (page) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sales?page=${page}&perPage=10`,
      );

      if (response.ok) {
        const data = await response.json();
        setSales(data.data);
        setTotalPages(data.meta.totalPages);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(page);
  }, [page]);

  useEffect(() => {
    fetchSaleInfo();
    fetchDailyRevenue();
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const formatTooltip = (value, name) => {
    const customName = name === 'revenue' ? 'درآمد' : name;
    const formattedValue = `${(value * 1000000).toLocaleString('fa-IR')} تومان`; // تبدیل به میلیون تومان
    return [formattedValue, customName];
  };

  return (
    <div>
      <SalesSummarySection saleInfo={saleInfo} isLoading={isLoadingInfo} />
      <LineChartComponent
        data={chartData}
        xAxisKey='date'
        yAxisKey='revenue'
        title='آمار فروش دوره‌های آفلاین'
        subtitle='۳۰ روز گذشته'
        className='my-10 md:my-14'
        labelY='میلیون تومان'
        isLoading={isLoadingChart}
        formatTooltip={formatTooltip}
      />
      <SalesTable
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        sales={sales}
        setSales={setSales}
        className='mt-6'
      />
    </div>
  );
}

export default SalePage;
