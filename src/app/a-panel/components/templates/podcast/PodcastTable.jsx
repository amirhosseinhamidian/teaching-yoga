/* eslint-disable no-undef */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { formatTime, getShamsiDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import Modal from '@/components/modules/Modal/Modal';

const PodcastTable = ({
  loading,
  episodes,
  setEpisodes,
  page,
  totalPages,
  onPageChange,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [episodeTempId, setEpisodeTempId] = useState(null);
  const [showEpisodeDeleteModal, setShowEpisodeDeleteModal] = useState(false);

  const handleDeleteEpisodeModal = (id) => {
    setEpisodeTempId(id);
    setShowEpisodeDeleteModal(true);
  };

  const handleDeleteEpisode = async () => {
    try {
      toast.showLoadingToast('در حال حذف اپیزود');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/podcast/episode/${episodeTempId}`,
        {
          method: 'DELETE',
        },
      );
      if (response.ok) {
        toast.showSuccessToast('اپیزود با موفقیت حذف شد.');
        setEpisodes(episodes.filter((episode) => episode.id !== episodeTempId));
        setEpisodeTempId(null);
        setShowEpisodeDeleteModal(false);
      } else {
        toast.showErrorToast('خطا در حذف اپیزود!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'cover',
      label: 'تصویر شاخص',
      minWidth: '70px',
      render: (_, row) => (
        <Image
          src={row.cover}
          alt={row.title}
          className='mx-auto rounded object-cover'
          width={96}
          height={56}
        />
      ),
    },
    { key: 'title', label: 'عنوان', minWidth: '150px' },
    {
      key: 'publishedAt',
      label: 'تاریخ انتشار',
      render: (date) => getShamsiDate(date),
    },
    {
      key: 'duration',
      label: 'زمان اپیزود',
      render: (time) => formatTime(time),
    },
    {
      key: 'actions',
      label: 'عملیات',
      // eslint-disable-next-line no-unused-vars
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleDeleteEpisodeModal(row.id)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => {
              router.push(`/a-panel/podcast/episode/edit/${row.id}`);
            }}
          />
        </div>
      ),
    },
  ];

  const data = episodes?.map((episode, index) => ({
    id: episode.id,
    number: index + 1 + (page - 1) * 10,
    duration: episode?.duration,
    cover: episode?.coverImageUrl
      ? episode.coverImageUrl
      : '/images/no-image-found.jpg',
    title: episode.title,
    publishedAt: episode.publishedAt,
  }));
  return (
    <div>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 sm:mt-10'
        loading={loading}
        empty={!episodes || episodes?.length === 0}
        emptyText='اپیزودی وجود ندارد.'
      />
      {episodes.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showEpisodeDeleteModal && (
        <Modal
          title='حذف اپیزود'
          desc='با حذف این اپیزود از پادکست دیگر دسترسی به اطلاعات آن وجود نخواهد داشت و در ساعات آینده از تمام پادگیر ها پاک خواهد شد. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setEpisodeTempId(null);
            setShowEpisodeDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteEpisode}
        />
      )}
    </div>
  );
};

PodcastTable.propTypes = {
  loading: PropTypes.bool.isRequired,
  episodes: PropTypes.array.isRequired,
  className: PropTypes.string,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setEpisodes: PropTypes.func.isRequired,
};

export default PodcastTable;
