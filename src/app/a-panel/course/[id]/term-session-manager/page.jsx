/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import HeadAction from '@/app/a-panel/components/templates/term-session-manager/HeadAction';
import { useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import Accordion from '@/components/Ui/Accordion/Accordion';
import { ImSpinner2 } from 'react-icons/im';
import AddSessionModal from '@/app/a-panel/components/modules/AddSessionModal/AddSessionModal';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash, LuPencil } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';
import Table from '@/components/Ui/Table/Table';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { FiUpload } from 'react-icons/fi';
import { IoPlay } from 'react-icons/io5';
import { MdAddToQueue } from 'react-icons/md';
import EditSessionModal from '@/app/a-panel/components/modules/EditSessionModal/EditSessionModal';
import VideoModal from '@/app/a-panel/components/modules/VideoModal/VideoModal';
import Switch from '@/components/Ui/Switch/Switch';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import UploadSessionMediaModal from '@/app/a-panel/components/modules/UploadSessionVideoModal/UploadSessionVideoModal';
import AudioModal from '@/app/a-panel/components/modules/AudioModal/AudioModal';
import {
  cancelAdminVideoJob,
  createAdminVideoJob,
  uploadAdminVideoSource,
  waitForAdminVideoJob,
} from '@/server/videoJobClient';

const AddTermSessionPage = () => {
  const params = useParams();
  const courseId = params.id;
  const searchParams = useSearchParams();
  const courseTitle = searchParams.get('courseTitle');
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const ffmpeg = useRef();

  const [terms, setTerms] = useState([]);
  const [termTempId, setTermTempId] = useState(null);
  const [sessionTemp, setSessionsTemp] = useState({});
  const [sessions, setSessions] = useState({});
  const [loadingSessions, setLoadingSessions] = useState({});
  const [sessionTempId, setSessionTempId] = useState();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [previewVideoSessionId, setPreviewVideoSessionId] = useState(null);
  const [previewAudioSessionId, setPreviewAudioSessionId] = useState(null);

  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showDeleteTermModal, setShowDeleteTermModal] = useState(false);
  const [showUploadVideoSessionModal, setShowUploadVideoSessionModal] =
    useState(false);
  const [showUploadAudioSessionModal, setShowUploadAudioSessionModal] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);

  const handelShowAddSessionModal = (termId) => {
    setTermTempId(termId);
    setShowAddSessionModal(true);
  };

  const handleAddSessionSuccessfully = (newSession) => {
    setShowAddSessionModal(false);

    setSessions((prevSessions) => {
      const termId = newSession.termId;

      // بررسی اینکه آیا جلسات برای این ترم قبلاً وجود دارد
      const existingSessions = prevSessions[termId] || [];

      // افزودن جلسه جدید به آرایه موجود
      const updatedSessions = [...existingSessions, newSession];

      // مرتب‌سازی جلسات براساس order برای حفظ ترتیب درست
      updatedSessions.sort((a, b) => a.order - b.order);

      return {
        ...prevSessions,
        [termId]: updatedSessions,
      };
    });
  };

  const fetchTerms = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${courseId}/terms`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch terms');
      }
      const data = await response.json();
      setTerms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [courseId]);

  const addTermSuccessfully = () => {
    fetchTerms();
  };

  const fetchSessions = async (termId, forceUpdate = false) => {
    // اگر اطلاعات از قبل موجود است و فلگ forceUpdate فعال نیست، درخواست نفرست
    if (!forceUpdate && sessions[termId]) return;

    setLoadingSessions((prev) => ({ ...prev, [termId]: true }));
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termId}/sessions`
      );
      const data = await response.json();
      setSessions((prev) => ({ ...prev, [termId]: data }));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions((prev) => ({ ...prev, [termId]: false }));
    }
  };

  const handleShowDeleteModal = (row) => {
    setTermTempId(row.termId);
    setSessionTempId(row.id);
    setShowDeleteSessionModal(true);
  };

  const handleShowEditSessionModal = (session) => {
    setSessionsTemp(session);
    setShowEditSessionModal(true);
  };

  const handleShowDeleteTermModal = (termId) => {
    setTermTempId(termId);
    setShowDeleteTermModal(true);
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
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setShowDeleteSessionModal(false);

        setSessions((prevSessions) => {
          const updatedSessions = { ...prevSessions };
          updatedSessions[termTempId] = updatedSessions[termTempId]
            .filter((session) => session.id !== sessionTempId)
            .map((session, index) => ({
              ...session,
              order: index + 1, // بروزرسانی فیلد order هر جلسه
            }));

          return updatedSessions;
        });
        setSessionTempId('');
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTerm = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${courseId}/terms/${termTempId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setShowDeleteTermModal(false);

        // remove term deleted from terms
        setTerms(terms.filter((term) => term.id !== termTempId));

        setTermTempId(null);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
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

      await fetchSessions(termId, true);

      setTermTempId(null);
      setSessionTempId('');

      return {
        job: readyJob,
        message: 'ویدئوی جلسه با موفقیت آپلود و پردازش شد.',
      };
    } catch (error) {
      /*
       * اگر کاربر حین Upload یا QUEUED عملیات را متوقف کند،
       * تلاش می‌کنیم Job و فایل موقت پاک شوند.
       *
       * اگر FFmpeg پردازش را شروع کرده باشد، API ممکن است
       * پاسخ 409 بدهد؛ Worker در آن حالت ادامه می‌دهد.
       */
      if (error?.name === 'AbortError' && jobId) {
        await cancelAdminVideoJob({
          jobId,
        }).catch(() => {});
      }

      throw error;
    }
  };

  const handleSessionAudioUpload = async (
    outFiles,
    _isVertical,
    accessLevel
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
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        audioKey: uploadData.fileKey,
        accessLevel,
        sessionId: currentSessionId,
      }),
    });

    const saveData = await saveResponse.json().catch(() => ({}));

    if (!saveResponse.ok) {
      throw new Error(saveData.error || 'خطا در ذخیره اطلاعات فایل صوتی.');
    }

    if (!saveData.data?.id) {
      throw new Error('اطلاعات فایل صوتی از سرور دریافت نشد.');
    }

    setSessions((previousSessions) => {
      const termSessions = previousSessions[currentTermId] || [];

      return {
        ...previousSessions,

        [currentTermId]: termSessions.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,

                type: saveData.session?.type || 'AUDIO',

                isActive: saveData.session?.isActive ?? true,

                audio: {
                  id: saveData.data.id,

                  audioKey: saveData.data.audioKey,

                  accessLevel: saveData.data.accessLevel,

                  status: saveData.data.status,

                  createAt: saveData.data.createAt,

                  updatedAt: saveData.data.updatedAt,
                },
              }
            : session
        ),
      };
    });

    return {
      audio: saveData.data,
      session: saveData.session,

      message: uploadData.message || 'فایل صوتی جلسه با موفقیت آپلود شد.',
    };
  };

  const handleUpdateSessionSuccessfully = (updatedSession) => {
    const termId = updatedSession.termId;

    setSessions((prevSessions) => {
      // بررسی وجود جلسات برای این ترم
      const existingSessions = prevSessions[termId] || [];

      // ایجاد لیست جدید با جایگزینی جلسه به‌روزشده
      const updatedSessions = existingSessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, ...updatedSession }
          : session
      );

      return {
        ...prevSessions,
        [termId]: updatedSessions,
      };
    });

    setSessionsTemp({});
    setShowEditSessionModal(false);
  };

  const openVideoModal = (sessionId) => {
    setPreviewVideoSessionId(sessionId);

    setShowVideoModal(true);
  };

  const openAudioModal = (sessionId) => {
    setPreviewAudioSessionId(sessionId);

    setShowAudioModal(true);
  };

  const toggleActiveStatus = async (row, currentStatus) => {
    if (!(row?.video?.videoKey || row?.audio?.audioKey)) {
      toast.showErrorToast('امکان فعال سازی جلسه بدون ویدیو وجود ندارد!');
      return;
    }
    row.isActive = currentStatus;
    try {
      setSessions((prev) => ({
        ...prev,
        [row.termId]: prev[row.termId].map((session) =>
          session.id === row.id
            ? { ...session, isActive: currentStatus } // وضعیت جدید به‌روزرسانی می‌شود
            : session
        ),
      }));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session/${row.id}/active-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: currentStatus }), // ارسال مقدار جدید
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating activeStatus:', error);
      // بازگرداندن به حالت قبلی در صورت خطا
      setSessions((prev) => ({
        ...prev,
        [row.termId]: prev[row.termId].map((session) =>
          session.id === row.id
            ? { ...session, isActive: currentStatus }
            : session
        ),
      }));
    }
  };

  const handleOrderChange = async (sessionId, termId, newOrder, oldOrder) => {
    try {
      toast.showLoadingToast('در حال بروزرسانی ترتیب جلسه...');
      const payload = { newOrder: newOrder, oldOrder: oldOrder };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termId}/sessions/${sessionId}/change-order`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error('Failed to update session order');
      }
      const data = await response.json();
      setSessions((prevSessions) => {
        const updatedSessions = { ...prevSessions };

        // به‌روزرسانی لیست جلسات ترم خاص با داده‌های جدید
        updatedSessions[termId] = data.updatedSessions;

        return updatedSessions;
      });
      toast.showSuccessToast('ترتیب جلسه با موفقیت بروز شد.');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      ffmpeg.current = createFFmpeg({
        log: true,
        corePath:
          'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      });

      await ffmpeg.current.load();
    })();
  }, []);

  const tableColumns = [
    {
      key: 'order',
      minWidth: '100px',
      label: 'ترتیب جلسات',
      render: (_, row) => {
        const termSessions = sessions[row.termId] || [];

        // تعداد جلسات ← n
        const total = termSessions.length;

        // ساخت گزینه‌های 1 تا n
        const options = Array.from({ length: total }, (_, i) => ({
          label: `جلسه ${i + 1}`,
          value: i + 1,
        }));

        return (
          <SimpleDropdown
            options={options}
            value={row.order}
            onChange={(newOrder) =>
              handleOrderChange(row.id, row.termId, newOrder, row.order)
            }
          />
        );
      },
    },
    { key: 'name', label: 'نام جلسه', minWidth: '150px' },

    {
      key: 'mediaUpload',
      label: 'محتوا',
      minWidth: '90px',
      maxWidth: '100px',
      render: (_, row) => {
        if (row.video?.videoKey) {
          return (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => openVideoModal(row.id)}
            >
              <IoPlay size={32} className='text-white' />
            </div>
          );
        } else if (row.audio?.audioKey) {
          return (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => openAudioModal(row.id)}
            >
              <IoPlay size={32} className='text-white' />
            </div>
          );
        } else {
          return (
            <div className='mx-auto flex h-16 w-full flex-col items-center justify-center gap-1 rounded-xl bg-black opacity-85 md:cursor-pointer'>
              {row.type === 'VIDEO' ? (
                <div
                  onClick={() => uploadVideoSession(row.termId, row.id)}
                  className='flex flex-col items-center'
                >
                  <FiUpload size={20} className='text-white' />
                  <span className='text-[10px]'>آپلود ویدیو</span>
                </div>
              ) : (
                <div
                  onClick={() => uploadAudioSession(row.termId, row.id)}
                  className='flex flex-col items-center'
                >
                  <FiUpload size={20} className='text-white' />
                  <span className='text-[10px]'>آپلود صدا</span>
                </div>
              )}
            </div>
          );
        }
      },
    },

    {
      key: 'accessLevel',
      label: 'سطح دسترسی',
      render: (_, row) => {
        const level = row.video?.accessLevel || row.audio?.accessLevel;
        switch (level) {
          case 'PUBLIC':
            return <span>عمومی</span>;
          case 'REGISTERED':
            return <span>ثبت‌نام</span>;
          case 'PURCHASED':
            return <span>خریداری</span>;
          default:
            return <span>نامشخص</span>;
        }
      },
    },

    {
      key: 'actions',
      label: 'عملیات',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleShowDeleteModal(row)}
          />
          <ActionButtonIcon
            color='blue'
            icon={LuPencil}
            onClick={() => handleShowEditSessionModal(row)}
          />
        </div>
      ),
    },

    {
      key: 'active',
      label: 'فعال/غیرفعال',
      render: (_, row) => (
        <Switch
          className='mt-3 justify-center'
          size='small'
          checked={row.isActive}
          onChange={(newStatus) => toggleActiveStatus(row, newStatus)}
        />
      ),
    },
  ];

  return (
    <div>
      <HeadAction
        courseId={courseId}
        courseTitle={courseTitle}
        addTermSuccessfully={addTermSuccessfully}
      />
      <div>
        {loading ? (
          <ImSpinner2
            size={36}
            className='mx-auto mt-16 animate-spin text-primary'
          />
        ) : (
          <>
            {terms.map((term) => (
              <Accordion
                key={term.id}
                title={term.name}
                subtitle={term.subtitle}
                info1={`هزینه ترم: ${term.price === 0 ? 'رایگان' : `${term.price.toLocaleString('fa-IR')} تومان`}`}
                info2={`تعداد جلسات : ${term.sessions.length ? term.sessions.length : '0'}`}
                className='mt-6 flex-1 bg-foreground-light dark:bg-foreground-dark'
                onToggle={(isOpen) => {
                  if (isOpen) fetchSessions(term.id);
                }}
                actionLeftContent={
                  <div className='flex gap-2'>
                    <ActionButtonIcon
                      color='red'
                      icon={LuTrash}
                      onClick={() => handleShowDeleteTermModal(term.id)}
                    />
                    <ActionButtonIcon
                      color='accent'
                      icon={MdAddToQueue}
                      onClick={() => handelShowAddSessionModal(term.id)}
                    />
                  </div>
                }
                content={
                  <Table
                    columns={tableColumns}
                    data={sessions[term.id] || []}
                    loading={loadingSessions[term.id]}
                    empty={sessions[term.id]?.length === 0}
                    emptyText='هیچ جلسه ای برای این ترم وجود ندارد.'
                  />
                }
              />
            ))}
          </>
        )}
      </div>
      {showAddSessionModal && (
        <AddSessionModal
          onClose={() => setShowAddSessionModal(false)}
          termId={termTempId}
          onSuccess={(newSession) => handleAddSessionSuccessfully(newSession)}
        />
      )}
      {showDeleteSessionModal && (
        <Modal
          title='حذف جلسه'
          desc='در صورت حذف جلسه دیگر به اطلاعات آن دسترسی ندارید. همینطور ویدیو جلسه نیز پاک خواهد شد. آیا از حذف این جلسه مطمئن هستید؟'
          icon={LuTrash}
          iconSize={32}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteSessionModal(false)}
          secondaryButtonClick={handleDeleteSession}
        />
      )}
      {showDeleteTermModal && (
        <Modal
          title='حذف ترم'
          desc='آیا از حذف ترم مطمئن هستید؟'
          icon={LuTrash}
          iconSize={32}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteTermModal(false)}
          secondaryButtonClick={handleDeleteTerm}
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
            setSessionsTemp({});
          }}
          session={sessionTemp}
          onSuccess={(updatedSession) =>
            handleUpdateSessionSuccessfully(updatedSession)
          }
        />
      )}
      {showVideoModal && previewVideoSessionId && (
        <VideoModal
          sessionId={previewVideoSessionId}
          onClose={() => {
            setShowVideoModal(false);
            setPreviewVideoSessionId(null);
          }}
        />
      )}

      {showAudioModal && previewAudioSessionId && (
        <AudioModal
          sessionId={previewAudioSessionId}
          onClose={() => {
            setShowAudioModal(false);
            setPreviewAudioSessionId(null);
          }}
        />
      )}
    </div>
  );
};

export default AddTermSessionPage;
