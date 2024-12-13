/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use client';
import React, { useEffect, useState } from 'react';
import HeadAction from '@/app/a-panel/components/templates/addTermSession/HeadAction';
import { useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import Accordion from '@/components/Ui/Accordion/Accordion';
import { formatTime } from '@/utils/dateTimeHelper';
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
import UploadSessionVideoModal from '@/app/a-panel/components/modules/UploadSessionVideoModal/UploadSessionVideoModal';
import AddEditTermModal from '@/app/a-panel/components/modules/AddEditTermModal/AddEditTermModal';
import EditSessionModal from '@/app/a-panel/components/modules/EditSessionModal/EditSessionModal';
import VideoModal from '@/app/a-panel/components/modules/VideoModal/VideoModal';
import Switch from '@/components/Ui/Switch/Switch';

const AddTermSessionPage = () => {
  const params = useParams();
  const courseId = params.id;
  const searchParams = useSearchParams();
  const courseTitle = searchParams.get('courseTitle');
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [terms, setTerms] = useState([]);
  const [termTempId, setTermTempId] = useState(null);
  const [termTemp, setTermTemp] = useState({});
  const [sessionTemp, setSessionsTemp] = useState({});
  const [sessions, setSessions] = useState({});
  const [loadingSessions, setLoadingSessions] = useState({});
  const [sessionTempId, setSessionTempId] = useState();
  const [tempVideoUrl, setTempVideoUrl] = useState('');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoadingId, setVideoLoadingId] = useState(null);

  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showDeleteTermModal, setShowDeleteTermModal] = useState(false);
  const [showUploadVideoSessionModal, setShowUploadVideoSessionModal] =
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
  const handleShowEditTermModal = (term) => {
    setTermTemp(term);
    setTermTempId(term.id);
    setShowEditTermModal(true);
  };

  const handleDeleteSession = async () => {
    try {
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
          updatedSessions[termTempId] = updatedSessions[termTempId].filter(
            (session) => session.id !== sessionTempId,
          );
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termTempId}`,
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

  const handleSessionVideoUpload = async (file) => {
    if (!file) {
      toast.showErrorToast('لطفاً یک ویدیو انتخاب کنید.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('courseName', courseTitle);
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
      const result = await response.json();
      toast.showSuccessToast(result.message);

      // فراخوانی دوباره برای دریافت جلسات جدید
      await fetchSessions(termTempId, true);

      setShowUploadVideoSessionModal(false);
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
      console.error('خطای غیرمنتظره در آپلود:', error.message);
    } finally {
      setTermTempId(null);
      setSessionTempId('');
    }
  };

  const handleUpdateTermSuccessfully = (updatedTerm) => {
    setTerms((prevTerms) =>
      prevTerms.map((term) =>
        term.id === updatedTerm.id ? { ...term, ...updatedTerm } : term,
      ),
    );

    setShowEditTermModal(false);
    setTermTemp({});
    setTermTempId(null);
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

  const toggleActiveStatus = async (row, currentStatus) => {
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

  const tableColumns = [
    { key: 'order', label: 'شماره' },
    { key: 'name', label: 'نام جلسه' },
    {
      key: 'videoUpload', // تغییر کلید به videoUpload
      label: 'ویدیو',
      render: (value, row) =>
        row?.video?.videoKey ? (
          <div
            className='mx-auto flex h-16 w-32 flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
            onClick={() => openVideoModal(row.video.videoKey, row.video.id)}
          >
            {videoLoadingId === row.video.id ? (
              <ImSpinner2 size={32} className='animate-spin text-white' />
            ) : (
              <IoPlay size={32} className='text-white' />
            )}
          </div>
        ) : (
          <div
            className='mx-auto flex h-16 w-32 flex-col items-center justify-center rounded-xl bg-black opacity-85 md:cursor-pointer'
            onClick={() => uploadVideoSession(row.termId, row.id)}
          >
            <FiUpload size={32} className='text-white' />
            <span className='text-xs'>آپلود ویدیو جلسه</span>
          </div>
        ),
    },
    {
      key: 'accessLevel', // تغییر کلید به accessLevel
      label: 'سطح دسترسی',
      render: (value, row) => {
        switch (row?.video?.accessLevel) {
          case 'PUBLIC':
            return <span>عمومی</span>;
          case 'REGISTERED':
            return <span>ثبت‌نام </span>;
          case 'PURCHASED':
            return <span>خریداری </span>;
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
      label: 'فعال/غیر فعال',
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
                info1={`هزینه ترم: ${term.price.toLocaleString('fa-IR')} تومان`}
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
                      color='blue'
                      icon={LuPencil}
                      onClick={() => handleShowEditTermModal(term)}
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
          desc='در صورت حذف جلسه دیگر به اطلاعات آن دسترسی ندارید. با حذف جلسه محتوای ویدیویی آن پاک نخواهد شد برای این کار باید از بخش مدیریت رسانه  اقدام کنید. آیا از حذف این جلسه مطمئن هستید؟'
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
          desc='در صورت حذف ترم دیگر به اطلاعات آن و جلسات آن دسترسی ندارید. با حذف ترم محتوای ویدیویی جلسات آن پاک نخواهد شد برای این کار باید از بخش مدیریت رسانه  اقدام کنید. آیا از حذف این ترم مطمئن هستید؟'
          icon={LuTrash}
          iconSize={32}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteTermModal(false)}
          secondaryButtonClick={handleDeleteTerm}
        />
      )}
      {showUploadVideoSessionModal && (
        <UploadSessionVideoModal
          onClose={() => setShowUploadVideoSessionModal(false)}
          onUpload={handleSessionVideoUpload}
        />
      )}
      {showEditTermModal && (
        // edit modal
        <AddEditTermModal
          courseId={courseId}
          onClose={() => {
            setShowEditTermModal(false);
            setTermTemp({});
            setTermTempId(null);
          }}
          term={termTemp}
          onSuccess={(updatedTerm) =>
            handleUpdateTermSuccessfully(updatedTerm.term)
          }
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
    </div>
  );
};

export default AddTermSessionPage;
