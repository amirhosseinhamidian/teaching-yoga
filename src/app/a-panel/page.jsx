/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import NotificationSection from './components/templates/dashboard/NotificationSection';
import DashboardCourseSummarySection from './components/templates/dashboard/DashboardCourseSummarySection';
import DashboardUserSummarySection from './components/templates/dashboard/DashboardUserSummarySection';
import LineChartComponent from '@/components/Ui/LineChart/LineChartComponent';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import CourseSaleTable from './components/templates/dashboard/CourseSaleTable';

export default function AdminPage() {
  const [infos, setInfos] = useState({});
  const [infosLoading, setInfosLoading] = useState(false);
  const [chartVisitData, setChartVisitData] = useState([]);
  const [isLoadingVisitChart, setIsLoadingVisitChart] = useState(false);
  const [chartSaleData, setChartSaleData] = useState([]);
  const [isLoadingSaleChart, setIsLoadingSaleChart] = useState(false);
  const [CourseSaleData, setCourseSaleData] = useState([]);
  const [isLoadingCourseSale, setIsLoadingCourseSale] = useState(false);

  const fetchInfos = async () => {
    try {
      setInfosLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setInfos(data);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setInfosLoading(false);
    }
  };

  const fetchDailyVisit = async () => {
    try {
      setIsLoadingVisitChart(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/daily-visit`,
      );

      if (response.ok) {
        const data = await response.json();
        // اعمال تغییرات روی دیتا
        const transformedData = data.map((item) => ({
          ...item,
          visits: item.visits,
          date: getShamsiDate(item.date), // تبدیل تاریخ به شمسی
        }));

        setChartVisitData(transformedData);
      } else {
        console.error(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingVisitChart(false);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      setIsLoadingSaleChart(true);
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

        setChartSaleData(transformedData);
      } else {
        console.error(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSaleChart(false);
    }
  };

  const fetchCourseSale = async () => {
    try {
      setIsLoadingCourseSale(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/dashboard/course-sale`,
      );
      if (response.ok) {
        const data = await response.json();
        setCourseSaleData(data);
      } else {
        throw new Error('Error To Fetch course sale data.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCourseSale(false);
    }
  };

  useEffect(() => {
    fetchInfos();
    fetchDailyVisit();
    fetchDailyRevenue();
    fetchCourseSale();
  }, []);

  const formatVisitTooltip = (value, name) => {
    const customName = name === 'visits' ? 'بازدید' : name;
    const formattedValue = value;
    return [formattedValue, customName];
  };

  const formatSaleTooltip = (value, name) => {
    const customName = name === 'revenue' ? 'درآمد' : name;
    const formattedValue = `${(value * 1000000).toLocaleString('fa-IR')} تومان`; // تبدیل به میلیون تومان
    return [formattedValue, customName];
  };

  return (
    <div>
      <NotificationSection />
      <DashboardCourseSummarySection
        courseInfo={infos.courseInfos}
        isLoading={infosLoading}
        className='mt-6 sm:mt-10'
      />
      <DashboardUserSummarySection
        userInfo={infos.userInfos}
        isLoading={infosLoading}
        className='mt-6 sm:mt-10'
      />
      <LineChartComponent
        data={chartVisitData}
        xAxisKey='date'
        yAxisKey='visits'
        title='آمار بازدید سایت'
        subtitle='۳۰ روز گذشته'
        className='my-10 md:my-14'
        isLoading={isLoadingVisitChart}
        formatTooltip={formatVisitTooltip}
      />
      <LineChartComponent
        data={chartSaleData}
        xAxisKey='date'
        yAxisKey='revenue'
        title='آمار فروش دوره‌های آفلاین'
        subtitle='۳۰ روز گذشته'
        className='my-10 md:my-14'
        labelY='میلیون تومان'
        isLoading={isLoadingSaleChart}
        formatTooltip={formatSaleTooltip}
      />
      <CourseSaleTable
        isLoading={isLoadingCourseSale}
        courses={CourseSaleData}
      />
    </div>
  );
}
