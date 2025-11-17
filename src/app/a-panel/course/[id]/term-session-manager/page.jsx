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
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoadingId, setVideoLoadingId] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [tempAudioUrl, setTempAudioUrl] = useState('');

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses/${courseId}/terms`,
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termId}/sessions`,
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
        },
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
        },
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

  const handleSessionVideoUpload = async (
    outFiles,
    isVertical,
    accessLevel,
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoKey,
            accessLevel,
            sessionId: sessionTempId,
          }),
        },
      );

      if (resSave.ok) {
        toast.showSuccessToast(message);
        // فراخوانی دوباره برای دریافت جلسات جدید
        await fetchSessions(termTempId, true);
      } else {
        toast.showErrorToast('خطا در ذخیره سازی.');
      }

      setShowUploadVideoSessionModal(false);
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
      console.error('خطای غیرمنتظره در آپلود:', error.message);
    } finally {
      setTermTempId(null);
      setSessionTempId('');
    }
  };

  const handleSessionAudioUpload = async (
    outFiles,
    isVertical,
    accessLevel,
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
          method: 'POST',
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
        setSessions((prev) => ({
          ...prev,
          [termTempId]: prev[termTempId].map((session) =>
            session.id === sessionTempId
              ? {
                  ...session,
                  audio: {
                    id: audioData.data.id,
                    audioKey: audioData.data.audioKey,
                    accessLevel: audioData.data.accessLevel,
                  },
                  isActive: true,
                }
              : session,
          ),
        }));
      } else {
        toast.showErrorToast('خطا در ذخیره سازی.');
      }
    } catch (err) {
      toast.showErrorToast(err.message);
    } finally {
      setTermTempId(null);
      setSessionTempId('');
      setShowUploadAudioSessionModal(false);
    }
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
          : session,
      );

      return {
        ...prevSessions,
        [termId]: updatedSessions,
      };
    });

    setSessionsTemp({});
    setShowEditSessionModal(false);
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
            : session,
        ),
      }));
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session/${row.id}/active-status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: currentStatus }), // ارسال مقدار جدید
        },
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
            : session,
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
        },
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
      key: "order",
      minWidth: "100px",
      label: "ترتیب جلسات",
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
              onClick={() => openVideoModal(row.video.videoKey, row.video.id)}
            >
              {videoLoadingId === row.video.id ? (
                <ImSpinner2 size={32} className='animate-spin text-white' />
              ) : (
                <IoPlay size={32} className='text-white' />
              )}
            </div>
          );
        } else if (row.audio?.audioKey) {
          return (
            <div
              className='mx-auto flex h-16 w-full flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
              onClick={() => openAudioModal(row.audio.audioKey)}
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
    </div>
  );
};

export default AddTermSessionPage;
