'use client';
import React, { useEffect, useState } from 'react';
import BlogTableSection from '../components/templates/blog/BlogTableSection';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import BlogSummarySection from '../components/templates/blog/BlogSummarySection';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import LineChartComponent from '@/components/Ui/LineChart/LineChartComponent';
import HeadAction from '../components/templates/blog/HeadAction';

function BlogPage() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [blogInfo, setBlogInfo] = useState({});
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartData, setChartData] = useState([]);

  const fetchSaleInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(`/api/admin/blog/info`);
      if (response.ok) {
        const data = await response.json();
        setBlogInfo(data);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const fetchDailyVisit = async () => {
    try {
      setIsLoadingChart(true);
      const response = await fetch(`/api/admin/blog/daily-visit`);

      if (response.ok) {
        const data = await response.json();
        // اعمال تغییرات روی دیتا
        const transformedData = data.map((item) => ({
          ...item,
          visits: item.visits,
          date: getShamsiDate(item.date),
        }));

        setChartData(transformedData);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در نمودار');
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchSaleInfo();
    fetchDailyVisit();
  }, []);

  const formatTooltip = (value, name) => {
    const customName = name === 'visits' ? 'بازدید' : name;
    return [value, customName];
  };

  return (
    <div>
      <HeadAction className='mb-10' />
      <BlogSummarySection blogInfo={blogInfo} isLoading={isLoadingInfo} />
      <LineChartComponent
        data={chartData}
        xAxisKey='date'
        yAxisKey='visits'
        title='نمودار بازدیدها'
        subtitle='۳۰ روز گذشته'
        className='my-10 md:my-14'
        labelY='بازدید'
        isLoading={isLoadingChart}
        formatTooltip={formatTooltip}
      />
      <BlogTableSection />
    </div>
  );
}

export default BlogPage;
