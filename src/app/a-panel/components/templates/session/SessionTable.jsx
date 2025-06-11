/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import { formatTime, getShamsiDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import { ImSpinner2 } from 'react-icons/im';
import { IoPlay } from 'react-icons/io5';
import { FiUpload } from 'react-icons/fi';
import { MdAddToQueue } from 'react-icons/md';
import Switch from '@/components/Ui/Switch/Switch';
import VideoModal from '../../modules/VideoModal/VideoModal';
import EditSessionModal from '../../modules/EditSessionModal/EditSessionModal';
import AudioModal from '../../modules/AudioModal/AudioModal';
import UploadSessionMediaModal from '../../modules/UploadSessionVideoModal/UploadSessionVideoModal';

const SessionTable = ({
  className,
  sessions,
  setSessions,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [sessionTempId, setSessionTempId] = useState(null);
  const [termTempId, setTermTempId] = useState(null);
  const [showSessionDeleteModal, setShowSessionDeleteModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(null);
  const [videoLoadingId, setVideoLoadingId] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [tempAudioUrl, setTempAudioUrl] = useState('');
  const [sessionTemp, setSessionTemp] = useState({});
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showUpdateVideoSessionModal, setShowUpdateVideoSessionModal] =
    useState(false);
  const [showUpdateAudioSessionModal, setShowUpdateAudioSessionModal] =
    useState(false);
  const [showUploadVideoSessionModal, setShowUploadVideoSessionModal] =
    useState(false);

  const [showUploadAudioSessionModal, setShowUploadAudioSessionModal] =
    useState(false);

  const handleDeleteSessionModal = (sessionId, termId) => {
    setSessionTempId(sessionId);
    setTermTempId(termId);
    setShowSessionDeleteModal(true);
  };

  const handleDeleteSession = async () => {
    try {
      toast.showLoadingToast('در حال حذف جلسه، ممکن است چند لحظه طول بکشد...', {
        duration: 6000,
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termTempId}/sessions/${sessionTempId}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setSessions((prev) =>
          prev.filter((session) => session.sessionId !== sessionTempId),
        );

        setSessionTempId(null);
        setTermTempId(null);
        setShowSessionDeleteModal(false);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleActiveStatus = async (row, currentStatus) => {
    if (!(row.videoKey || row.audioKey)) {
      toast.showErrorToast(
        'امکان فعال سازی جلسه بدون ویدیو یا صدا وجود ندارد!',
      );
      return;
    }
    // تغییر مقدار در ردیف انتخاب‌شده
    const updatedStatus = currentStatus;

    try {
      // به‌روزرسانی سریع در UI (Optimistic Update)
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === row.sessionId
            ? { ...session, sessionIsActive: updatedStatus }
            : session,
        ),
      );

      // ارسال درخواست به سرور
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session/${row.sessionId}/active-status`,
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
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === row.sessionId
            ? { ...session, sessionIsActive: !updatedStatus }
            : session,
        ),
      );
    }
  };

  const openVideoModal = async (videoKey, videoId) => {
    try {
      setVideoLoadingId(videoId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/generate-video-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoKey }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch temporary link');
      }

      const { signedUrl } = await response.json();
      setTempVideoUrl(signedUrl);
      setShowVideoModal(true);
      setVideoLoadingId(null);
    } catch (error) {
      console.error('Error fetching video link:', error);
    }
  };

  const openAudioModal = async (audioKey) => {
    setShowAudioModal(true);
    setTempAudioUrl(audioKey);
  };

  const uploadVideoSession = (termId, sessionId) => {
    setTermTempId(termId);
    setSessionTempId(sessionId);
    setShowUploadVideoSessionModal(true);
  };

  const uploadAudioSession = (termId, sessionId) => {
    setTermTempId(termId);
    setSessionTempId(sessionId);
    setShowUploadAudioSessionModal(true);
  };

  const handleSessionVideoUpload = async (
    outFiles,
    isVertical,
    accessLevel,
    isUpdate = false,
  ) => {
    if (!outFiles) {
      toast.showErrorToast('لطفاً یک ویدیو انتخاب کنید.');
      return;
    }

    const formData = new FormData();
    outFiles.forEach((file, index) => {
      formData.append(`file_${index}`, new Blob([file.data]), file.name);
    });
    formData.append('termId', termTempId);
    formData.append('sessionId', sessionTempId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/video`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.showErrorToast('خطایی رخ داده است.');
        console.error('خطا در آپلود:', errorData.error || 'خطایی رخ داده است.');
        return;
      }
      const { videoKey, message } = await response.json();

      const resSave = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-video`,
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoKey,
            accessLevel,
            sessionId: sessionTempId,
            videoId: sessionTemp?.videoId,
          }),
        },
      );

      if (resSave.ok) {
        const videoData = await resSave.json();
        toast.showSuccessToast(message);

        setSessions((prev) =>
          prev.map((session) =>
            session.sessionId === sessionTempId
              ? {
                  ...session,
                  videoKey: videoKey,
                  videoId: videoData.id,
                  videoAccessLevel: videoData.accessLevel,
                }
              : session,
          ),
        );
      } else {
        toast.showErrorToast('خطا در ذخیره سازی.');
      }

      if (isUpdate) {
        setShowUpdateVideoSessionModal(false);
      } else {
        setShowUploadVideoSessionModal(false);
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
      console.error('خطای غیرمنتظره در آپلود:', error.message);
    } finally {
      setTermTempId(null);
      setSessionTempId('');
      setSessionTemp(null);
    }
  };

  const handleSessionAudioUpload = async (
    outFiles,
    isVertical,
    accessLevel,
    isUpdate = false,
  ) => {
    if (!outFiles) {
      toast.showErrorToast('لطفاً یک فایل صوتی انتخاب کنید.');
      return;
    }
    const formData = new FormData();
    formData.append('file', outFiles[0]);
    formData.append('folderPath', `audio/${termTempId}/${sessionTempId}`); // مسیر دلخواه
    formData.append('fileName', 'audio'); // بدون پسوند

    try {
      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'خطا در آپلود فایل صوتی');
      }

      const resSave = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-audio`,
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioKey: data.fileUrl,
            accessLevel,
            sessionId: sessionTempId,
            audioId: sessionTemp?.audioId,
          }),
        },
      );

      if (resSave.ok) {
        const audioData = await resSave.json();
        toast.showSuccessToast(data.message);
        setSessions((prev) =>
          prev.map((session) =>
            session.sessionId === sessionTempId
              ? {
                  ...session,
                  audioKey: audioData.data.audioKey,
                  audioId: audioData.data.id,
                  audioAccessLevel: audioData.data.accessLevel,
                  sessionIsActive: isUpdate ? session.sessionIsActive : true,
                }
              : session,
          ),
        );
      } else {
        toast.showErrorToast('خطا در ذخیره سازی.');
      }

      if (isUpdate) {
        setShowUpdateAudioSessionModal(false);
      } else {
        setShowUploadAudioSessionModal(false);
      }
    } catch (err) {
      toast.showErrorToast(err.message);
    } finally {
      setTermTempId(null);
      setSessionTempId('');
      setSessionTemp(null);
    }
  };

  const handleUpdateSession = (updatedSession) => {
    console.log(updatedSession);
    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === updatedSession.id
          ? {
              ...session,
              sessionName: updatedSession.name,
              sessionDuration: updatedSession.duration,
              termId: updatedSession.termId,
              termName: updatedSession.term.name,
              videoAccessLevel: updatedSession.video?.accessLevel,
              audioAccessLevel: updatedSession.audio?.accessLevel,
            }
          : session,
      ),
    );
    setShowEditSessionModal(false);
    setSessionTemp(null);
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'videoUpload', // تغییر کلید به videoUpload
      label: 'محتوا',
      minWidth: '90px',
      maxWidth: '100px',
      render: (value, row) => {
        if (row?.type === 'VIDEO') {
          return row?.videoKey ? (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => openVideoModal(row.videoKey, row.videoId)}
            >
              {videoLoadingId === row.videoId ? (
                <ImSpinner2 size={32} className='animate-spin text-white' />
              ) : (
                <IoPlay size={32} className='text-white' />
              )}
            </div>
          ) : (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => uploadVideoSession(row.termId, row.sessionId)}
            >
              <FiUpload size={32} className='text-white' />
              <span className='text-xs'>آپلود ویدیو</span>
            </div>
          );
        } else if (row?.type === 'AUDIO') {
          return row?.audioKey ? (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => openAudioModal(row.audioKey)}
            >
              <IoPlay size={32} className='text-white' />
            </div>
          ) : (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => uploadAudioSession(row.termId, row.sessionId)}
            >
              <FiUpload size={32} className='text-white' />
              <span className='text-xs'>آپلود صدا</span>
            </div>
          );
        }
        return null;
      },
    },
    {
      key: 'courseTitles',
      label: 'دوره ها',
      minWidth: '150px',
      render: (_, row) => <p>{row?.courseTitles || ' ___ '}</p>,
    },

    {
      key: 'termName',
      label: 'ترم',
      minWidth: '120px',
    },
    {
      key: 'sessionName',
      label: 'جلسه',
      minWidth: '120px',
    },
    {
      key: 'sessionDuration',
      label: 'مدت زمان',
      maxWidth: '80px',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{formatTime(row.sessionDuration)}</p>
      ),
    },
    {
      key: 'createAt',
      label: 'تاریخ ایجاد',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getShamsiDate(row.type === 'VIDEO' ? row.videoCreatedAt : row.audioCreatedAt)}`}</p>
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
            onClick={() => handleDeleteSessionModal(row.sessionId, row.termId)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => {
              setShowEditSessionModal(true);
              setSessionTemp(row);
            }}
          />
          {row.videoId && (
            <ActionButtonIcon
              color='secondary'
              icon={MdAddToQueue}
              onClick={() => {
                setShowUpdateVideoSessionModal(true);
                setTermTempId(row.termId);
                setSessionTempId(row.sessionId);
                setSessionTemp(row);
              }}
            />
          )}
          {row.audioId && (
            <ActionButtonIcon
              color='secondary'
              icon={MdAddToQueue}
              onClick={() => {
                setShowUpdateAudioSessionModal(true);
                setTermTempId(row.termId);
                setSessionTempId(row.sessionId);
                setSessionTemp(row);
              }}
            />
          )}
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
          checked={row.sessionIsActive}
          onChange={(newStatus) => toggleActiveStatus(row, newStatus)}
        />
      ),
    },
  ];

  const data = sessions?.map((session, index) => ({
    number: index + 1 + (page - 1) * 10,
    type: session.type,
    sessionId: session.sessionId,
    sessionName: session.sessionName,
    sessionDuration: session.sessionDuration,
    sessionIsActive: session.sessionIsActive,
    videoKey: session.videoKey,
    videoId: session.videoId,
    videoCreatedAt: session?.videoCreatedAt,
    videoAccessLevel: session?.videoAccessLevel,
    audioKey: session?.audioKey,
    audioId: session?.audioId,
    audioAccessLevel: session?.audioAccessLevel,
    audioCreatedAt: session?.audioCreatedAt,
    termId: session.termId,
    termName: session.termName,
    courseTitles: session.courseTitles,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={sessions.length === 0}
        emptyText='هیچ جلسه ای وجود ندارد.'
      />
      {sessions.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showSessionDeleteModal && (
        <Modal
          title='حذف جلسه'
          desc='در صورت حذف جلسه دیگر به اطلاعات آن دسترسی ندارید. همینطور مدیا جلسه نیز پاک خواهد شد. آیا از حذف این جلسه مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setSessionTempId(null);
            setShowSessionDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteSession}
        />
      )}
      {showVideoModal && (
        <VideoModal
          onClose={() => {
            setShowVideoModal(false);
            setTempVideoUrl('');
          }}
          videoKey={tempVideoUrl}
        />
      )}
      {showAudioModal && (
        <AudioModal
          onClose={() => {
            setShowAudioModal(false);
            setTempAudioUrl('');
          }}
          audioKey={tempAudioUrl}
        />
      )}
      {showUploadVideoSessionModal && (
        <UploadSessionMediaModal
          mediaType='VIDEO'
          onClose={() => {
            setTermTempId(null);
            setSessionTempId(null);
            setShowUploadVideoSessionModal(false);
          }}
          onUpload={handleSessionVideoUpload}
        />
      )}
      {showUploadAudioSessionModal && (
        <UploadSessionMediaModal
          mediaType='AUDIO'
          onClose={() => {
            setTermTempId(null);
            setSessionTempId(null);
            setShowUploadAudioSessionModal(false);
          }}
          onUpload={handleSessionAudioUpload}
        />
      )}
      {showEditSessionModal && (
        <EditSessionModal
          onClose={() => {
            setShowEditSessionModal(false);
            setSessionTemp(null);
          }}
          onSuccess={handleUpdateSession}
          session={sessionTemp}
          isChangeTerm
        />
      )}
      {showUpdateVideoSessionModal && (
        <UploadSessionMediaModal
          mediaType='VIDEO'
          onClose={() => {
            setTermTempId(null);
            setSessionTempId(null);
            setSessionTemp(null);
            setShowUpdateVideoSessionModal(false);
          }}
          isUpdate
          videoAccessLevel={sessionTemp?.videoAccessLevel}
          onUpload={(outFiles, isVertical, accessLevel) =>
            handleSessionVideoUpload(outFiles, isVertical, accessLevel, true)
          }
        />
      )}
      {showUpdateAudioSessionModal && (
        <UploadSessionMediaModal
          onClose={() => {
            setTermTempId(null);
            setSessionTempId(null);
            setSessionTemp(null);
            setShowUpdateAudioSessionModal(false);
          }}
          mediaType='AUDIO'
          isUpdate
          mediaAccessLevel={sessionTemp?.audioAccessLevel}
          onUpload={(outFiles, isVertical, accessLevel) =>
            handleSessionAudioUpload(outFiles, isVertical, accessLevel, true)
          }
        />
      )}
    </div>
  );
};

SessionTable.propTypes = {
  className: PropTypes.string,
  sessions: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setSessions: PropTypes.func.isRequired,
};

export default SessionTable;
