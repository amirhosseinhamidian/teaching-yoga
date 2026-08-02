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
import { ImSpinner2 } from 'react-icons/im';
import { IoPlay } from 'react-icons/io5';
import { FiUpload } from 'react-icons/fi';
import { MdAddToQueue } from 'react-icons/md';
import Switch from '@/components/Ui/Switch/Switch';
import VideoModal from '../../modules/VideoModal/VideoModal';
import EditSessionModal from '../../modules/EditSessionModal/EditSessionModal';
import AudioModal from '../../modules/AudioModal/AudioModal';
import UploadSessionMediaModal from '../../modules/UploadSessionVideoModal/UploadSessionVideoModal';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import Button from '@/components/Ui/Button/Button';
import {
  cancelAdminVideoJob,
  createAdminVideoJob,
  uploadAdminVideoSource,
  waitForAdminVideoJob,
} from '@/server/videoJobClient';

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
  const [sessionTemp, setSessionTemp] = useState(null);

  const [showEditSessionModal, setShowEditSessionModal] = useState(null);
  const [videoLoadingId, setVideoLoadingId] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [tempAudioUrl, setTempAudioUrl] = useState('');
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

  // -----------------------------
  // حذف جلسه از یک ترم (انتخاب ترم)
  // -----------------------------
  const handleDeleteSessionModal = (row) => {
    setSessionTempId(row.sessionId);
    setSessionTemp(row);
    setTermTempId(null);
    setShowSessionDeleteModal(true);
  };

  const handleDeleteSession = async () => {
    if (!termTempId) {
      toast.showErrorToast('لطفاً ترم مورد نظر برای حذف را انتخاب کنید.');
      return;
    }

    try {
      toast.showLoadingToast('در حال حذف جلسه، ممکن است چند لحظه طول بکشد...', {
        duration: 6000,
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termTempId}/sessions/${sessionTempId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);

        // فقط از ترم انتخاب‌شده حذف شود؛ اگر دیگر ترمی نداشت، کل جلسه را از لیست حذف کن
        setSessions((prev) =>
          prev
            .map((session) =>
              session.sessionId === sessionTempId
                ? {
                    ...session,
                    terms: session.terms.filter((t) => t.termId !== termTempId),
                  }
                : session
            )
            .filter((session) => session.terms.length > 0)
        );

        setSessionTempId(null);
        setTermTempId(null);
        setSessionTemp(null);
        setShowSessionDeleteModal(false);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // -----------------------------
  // فعال/غیرفعال کردن جلسه
  // -----------------------------
  const toggleActiveStatus = async (row, currentStatus) => {
    if (!(row.videoKey || row.audioKey)) {
      toast.showErrorToast(
        'امکان فعال سازی جلسه بدون ویدیو یا صدا وجود ندارد!'
      );
      return;
    }
    const updatedStatus = currentStatus;

    try {
      // Optimistic Update
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === row.sessionId
            ? { ...session, sessionIsActive: updatedStatus }
            : session
        )
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session/${row.sessionId}/active-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: updatedStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating activeStatus:', error);
      // Rollback
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionId === row.sessionId
            ? { ...session, sessionIsActive: !updatedStatus }
            : session
        )
      );
    }
  };

  // -----------------------------
  // ویدیو
  // -----------------------------
  const openVideoModal = async (videoKey, videoId) => {
    try {
      setVideoLoadingId(videoId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/media-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaKey: videoKey,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch temporary link');
      }

      const result = await response.json();

      if (!response.ok || !result?.mediaUrl) {
        throw new Error(result?.error || 'دریافت آدرس ویدئو ناموفق بود.');
      }

      setTempVideoUrl(result.mediaUrl);
      setShowVideoModal(true);
      setVideoLoadingId(null);
    } catch (error) {
      console.error('Error fetching video link:', error);
    }
  };

  // -----------------------------
  // صوت
  // -----------------------------
  const openAudioModal = async (audioKey) => {
    setShowAudioModal(true);
    setTempAudioUrl(audioKey);
  };

  // -----------------------------
  // آپلود ویدیو — همیشه با اولین ترم
  // -----------------------------
  const uploadVideoSession = (sessionRow) => {
    const firstTermId = sessionRow.terms?.[0]?.termId;
    if (!firstTermId) {
      toast.showErrorToast('این جلسه در هیچ ترمی قرار ندارد.');
      return;
    }
    setTermTempId(firstTermId);
    setSessionTempId(sessionRow.sessionId);
    setSessionTemp(sessionRow);
    setShowUploadVideoSessionModal(true);
  };

  // -----------------------------
  // آپلود صوت — همیشه با اولین ترم
  // -----------------------------
  const uploadAudioSession = (sessionRow) => {
    const firstTermId = sessionRow.terms?.[0]?.termId;
    if (!firstTermId) {
      toast.showErrorToast('این جلسه در هیچ ترمی قرار ندارد.');
      return;
    }
    setTermTempId(firstTermId);
    setSessionTempId(sessionRow.sessionId);
    setSessionTemp(sessionRow);
    setShowUploadAudioSessionModal(true);
  };

  // -----------------------------
  // آپلود/بروزرسانی ویدیو
  // -----------------------------
  const handleSessionVideoUpload = async (file, accessLevel, controls = {}) => {
    const { signal, onProgress, onStageChange } = controls;

    if (!(file instanceof File)) {
      throw new Error('لطفاً یک فایل ویدئویی معتبر انتخاب کنید.');
    }

    const termId = Number(termTempId);
    const sessionId = sessionTempId;

    if (!Number.isInteger(termId) || termId <= 0 || !sessionId) {
      throw new Error('اطلاعات ترم یا جلسه معتبر نیست.');
    }

    let jobId = null;

    try {
      onStageChange?.('creating');
      onProgress?.(0);

      const createdJob = await createAdminVideoJob({
        sessionId,
        termId,
        accessLevel,
        signal,
      });

      jobId = createdJob.id;

      onStageChange?.('uploading');
      onProgress?.(0);

      await uploadAdminVideoSource({
        jobId,
        file,
        signal,
        onProgress,
      });

      onStageChange?.('queued');
      onProgress?.(0);

      const readyJob = await waitForAdminVideoJob({
        jobId,
        signal,

        onUpdate: (job) => {
          onStageChange?.(job.stage || job.status.toLowerCase());

          onProgress?.(
            Number.isFinite(job.displayProgress)
              ? job.displayProgress
              : job.progress || 0
          );
        },
      });

      /*
       * این قسمت را با تابع فعلی دریافت مجدد
       * لیست جلسات در SessionTable هماهنگ کن.
       */
      if (typeof fetchSessions === 'function') {
        await fetchSessions(termId, true);
      }

      setTermTempId(null);
      setSessionTempId('');

      return {
        job: readyJob,
        message: 'ویدئوی جلسه با موفقیت آپلود و پردازش شد.',
      };
    } catch (error) {
      if (error?.name === 'AbortError' && jobId) {
        await cancelAdminVideoJob({
          jobId,
        }).catch(() => {});
      }

      throw error;
    }
  };

  // -----------------------------
  // آپلود/بروزرسانی صوت
  // -----------------------------
  const handleSessionAudioUpload = async (
    outFiles,
    _isVertical,
    accessLevel,
    isUpdate = false
  ) => {
    const audioFile = Array.isArray(outFiles) ? outFiles[0] : outFiles;

    const currentTermId = termTempId;
    const currentSessionId = sessionTempId;

    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error('لطفاً یک فایل صوتی معتبر انتخاب کنید.');
    }

    if (!currentTermId || !currentSessionId) {
      throw new Error('اطلاعات ترم یا جلسه معتبر نیست.');
    }

    if (!accessLevel) {
      throw new Error('لطفاً سطح دسترسی فایل صوتی را مشخص کنید.');
    }

    const formData = new FormData();

    formData.append('file', audioFile);

    formData.append('folderPath', `audio/${currentTermId}/${currentSessionId}`);

    formData.append('fileName', 'audio');

    const uploadResponse = await fetch('/api/upload/audio', {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json().catch(() => ({}));

    if (!uploadResponse.ok) {
      throw new Error(uploadData.error || 'خطا در آپلود فایل صوتی.');
    }

    if (!uploadData.fileKey) {
      throw new Error('مسیر فایل صوتی از سرور دریافت نشد.');
    }

    const saveResponse = await fetch('/api/session-audio', {
      method: isUpdate ? 'PUT' : 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        audioKey: uploadData.fileKey,
        accessLevel,
        sessionId: currentSessionId,
        audioId: sessionTemp?.audioId,
      }),
    });

    const saveData = await saveResponse.json().catch(() => ({}));

    if (!saveResponse.ok) {
      throw new Error(saveData.error || 'خطا در ذخیره اطلاعات فایل صوتی.');
    }

    if (!saveData.data?.id) {
      throw new Error('اطلاعات فایل صوتی از سرور دریافت نشد.');
    }

    setSessions((previousSessions) =>
      previousSessions.map((session) =>
        session.sessionId === currentSessionId
          ? {
              ...session,

              type: saveData.session?.type || 'AUDIO',

              sessionType: saveData.session?.type || 'AUDIO',

              sessionIsActive: saveData.session?.isActive ?? true,

              audioKey: saveData.data.audioKey,

              audioId: saveData.data.id,

              audioAccessLevel: saveData.data.accessLevel,

              audioStatus: saveData.data.status,

              audioCreatedAt: saveData.data.createAt,

              audioUpdatedAt: saveData.data.updatedAt,
            }
          : session
      )
    );

    return {
      audio: saveData.data,
      session: saveData.session,
      isUpdate,

      message:
        uploadData.message ||
        (isUpdate
          ? 'فایل صوتی جلسه با موفقیت به‌روزرسانی شد.'
          : 'فایل صوتی جلسه با موفقیت آپلود شد.'),
    };
  };

  // -----------------------------
  // بروزرسانی جلسه بعد از ویرایش
  // -----------------------------
  const handleUpdateSession = (updatedSession) => {
    // updatedSession ساختارش ممکن است مثل قبل باشد یا شامل terms[]
    setSessions((prev) =>
      prev.map((session) =>
        session.sessionId === updatedSession.id
          ? {
              ...session,
              sessionName: updatedSession.name,
              sessionDuration: updatedSession.duration,
              sessionIsActive:
                typeof updatedSession.isActive === 'boolean'
                  ? updatedSession.isActive
                  : session.sessionIsActive,
              videoAccessLevel:
                updatedSession.video?.accessLevel ?? session.videoAccessLevel,
              audioAccessLevel:
                updatedSession.audio?.accessLevel ?? session.audioAccessLevel,
              terms: updatedSession.terms ?? session.terms,
            }
          : session
      )
    );
    setShowEditSessionModal(false);
    setSessionTemp(null);
  };

  // -----------------------------
  // ستون‌های جدول
  // -----------------------------
  const columns = [
    { key: 'number', label: 'شماره' },
    {
      key: 'videoUpload',
      label: 'محتوا',
      minWidth: '90px',
      maxWidth: '100px',
      render: (_, row) => {
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
              onClick={() => uploadVideoSession(row)}
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
              onClick={() => uploadAudioSession(row)}
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
      key: 'terms',
      label: 'ترم‌ها',
      minWidth: '150px',
      render: (_, row) => (
        <p>
          {row.terms && row.terms.length
            ? row.terms.map((t) => t.termName).join(' ، ')
            : '___'}
        </p>
      ),
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
        <p className='whitespace-nowrap'>
          {getShamsiDate(
            row.type === 'VIDEO' ? row.videoCreatedAt : row.audioCreatedAt
          )}
        </p>
      ),
    },
    {
      key: 'actions',
      minWidth: '80px',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleDeleteSessionModal(row)}
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
                const firstTermId = row.terms?.[0]?.termId;
                if (!firstTermId) {
                  toast.showErrorToast('این جلسه در هیچ ترمی قرار ندارد.');
                  return;
                }
                setShowUpdateVideoSessionModal(true);
                setTermTempId(firstTermId);
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
                const firstTermId = row.terms?.[0]?.termId;
                if (!firstTermId) {
                  toast.showErrorToast('این جلسه در هیچ ترمی قرار ندارد.');
                  return;
                }
                setShowUpdateAudioSessionModal(true);
                setTermTempId(firstTermId);
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
    ...session,
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

      {/* مودال انتخاب ترم برای حذف */}
      {showSessionDeleteModal && sessionTemp && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
          <div className='w-11/12 max-w-md rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
            <h3 className='mb-4 border-b pb-3 text-lg font-semibold text-text-light dark:text-text-dark'>
              حذف جلسه از ترم
            </h3>

            <p className='mb-3 text-sm text-subtext-light dark:text-subtext-dark'>
              این جلسه در ترم‌های زیر قرار دارد. انتخاب کنید از کدام ترم حذف
              شود:
            </p>

            {/* LIST OF TERMS */}
            <div className='mb-6 flex flex-col gap-2'>
              {sessionTemp.terms.map((t) => {
                const isActive = termTempId === t.termId;

                return (
                  <button
                    key={t.termId}
                    type='button'
                    onClick={() => setTermTempId(t.termId)}
                    className={`w-full rounded-lg border px-3 py-2 text-right text-sm transition-all ${
                      isActive
                        ? 'border-red bg-red bg-opacity-10 text-red'
                        : 'border-border-light dark:border-border-dark bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
                    } `}
                  >
                    {t.termName}
                  </button>
                );
              })}
            </div>

            {/* ACTION BUTTONS */}
            <div className='flex justify-end gap-3'>
              <OutlineButton
                type='button'
                color='subtext'
                onClick={() => {
                  setShowSessionDeleteModal(false);
                  setSessionTempId(null);
                  setTermTempId(null);
                  setSessionTemp(null);
                }}
              >
                انصراف
              </OutlineButton>

              <Button
                type='button'
                color='red'
                disabled={!termTempId} // 🔥 جلوگیری از حذف بدون انتخاب ترم
                onClick={handleDeleteSession}
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
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
            setSessionTemp(null);
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
            setSessionTemp(null);
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
          onUpload={handleSessionVideoUpload}
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
