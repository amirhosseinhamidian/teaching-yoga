/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PodcastInfo from '../components/templates/podcast/PodcastInfo';
import PodcastSummarySection from '../components/templates/podcast/PodcastSummarySection';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import PodcastTable from '../components/templates/podcast/PodcastTable';

const PodcastPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [podcast, setPodcast] = useState({});
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [episodes, setEpisodes] = useState([]);

  const fetchPodcastInfo = async () => {
    try {
      setPodcastLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/podcast`,
      );
      if (response.ok) {
        const data = await response.json();
        setPodcast(data);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast(' خطای غیرمنتظره در دریافت اطلاعات پادکست');
    } finally {
      setPodcastLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/podcast/episode?&page=${page}&perPage=10`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setEpisodes(data.data);
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      console.error(err);
      toast.showErrorToast(' خطای غیرمنتظره در دریافت اطلاعات اپیزودها');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcastInfo();
  }, []);

  useEffect(() => {
    fetchEpisodes();
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      <PodcastInfo podcast={podcast} loading={podcastLoading} />
      <PodcastSummarySection isLoading={false} className='my-6' />
      <PodcastTable
        loading={isLoading}
        episodes={episodes}
        onPageChange={handlePageChange}
        page={page}
        setEpisodes={setEpisodes}
        totalPages={totalPages}
      />
    </div>
  );
};

export default PodcastPage;
