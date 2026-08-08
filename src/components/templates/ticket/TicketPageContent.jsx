/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import TextEditor from '@/components/Ui/TextEditor/TextEditor';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import TicketItem from './TicketItem';

import { ANSWERED, CLOSED, OPEN } from '@/constants/ticketStatus';

import { createToastHandler } from '@/utils/toastHandler';

import { useTheme } from '@/contexts/ThemeContext';

import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';

import {
  HiOutlineArrowRight,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineHashtag,
  HiOutlineLockClosed,
  HiOutlinePaperAirplane,
} from 'react-icons/hi2';

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function TicketStatusBadge({ status }) {
  const config = {
    PENDING: {
      label: 'در انتظار بررسی',

      className: 'border-secondary/15 bg-secondary/10 text-secondary',
    },

    IN_PROGRESS: {
      label: 'در حال بررسی',

      className: 'border-blue/15 bg-blue/10 text-blue',
    },

    ANSWERED: {
      label: 'باز',

      className:
        'border-green-light/15 bg-green-light/10 text-green-light dark:text-green-dark',
    },

    OPEN: {
      label: 'باز',

      className:
        'border-green-light/15 bg-green-light/10 text-green-light dark:text-green-dark',
    },

    CLOSED: {
      label: 'بسته شده',

      className: 'border-purple-600/15 bg-purple-600/10 text-purple-600',
    },
  };

  const item = config[status] || {
    label: 'وضعیت نامشخص',

    className:
      'border-black/5 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark',
  };

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-xl border px-3 text-[10px] font-black sm:text-xs ${item.className}`}
    >
      {item.label}
    </span>
  );
}

TicketStatusBadge.propTypes = {
  status: PropTypes.string,
};

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

const TicketPageContent = ({ ticketId }) => {
  const { isDark } = useTheme();

  const toast = createToastHandler(isDark);

  const [ticket, setTicket] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [replyText, setReplyText] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);

  const [errorReplyText, setErrorReplyText] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Fetch
  |--------------------------------------------------------------------------
  */

  const fetchTicket = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}`,
        {
          cache: 'no-cache',

          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to Fetch Ticket Data!');
      }

      const data = await response.json();

      setTicket(data);
    } catch (error) {
      console.error('Error Fetch ticket: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Answered status
  |--------------------------------------------------------------------------
  */

  const checkAnsweredStatus = async () => {
    if (ticket.status === ANSWERED) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}/change-status`,
          {
            method: 'PUT',

            headers: {
              status: OPEN,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Filed to update ticket status');
        }

        setTicket((prevTicket) => ({
          ...prevTicket,

          status: OPEN,
        }));
      } catch (error) {
        console.error('Error Update Status : ', error);
      }
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  useEffect(() => {
    checkAnsweredStatus();
  }, [ticket]);

  /*
  |--------------------------------------------------------------------------
  | Reply
  |--------------------------------------------------------------------------
  */

  const submitReply = async () => {
    if (!replyText.trim()) {
      setErrorReplyText('پاسخ نباید خالی باشد.');

      return;
    }

    if (replyText.trim().length < 5) {
      setErrorReplyText('حداقل پاسخ ۵ کارکتر باید باشد.');

      return;
    }

    setErrorReplyText('');

    try {
      setSubmitLoading(true);

      const payload = {
        content: replyText,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}/reply`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Filed to update ticket status');
      }

      const data = await response.json();

      setReplyText('');

      setTicket((prevTicket) => ({
        ...prevTicket,

        ticketReplies: [data, ...prevTicket.ticketReplies],

        status: 'PENDING',
      }));

      toast.showSuccessToast('درخواست شما با موفقیت ارسال شد.');
    } catch (error) {
      console.error('Error to Send Reply Create Request : ', error);

      toast.showErrorToast('خطا در ارسال درخواست، لطفا بعدا تلاش کنید.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Close
  |--------------------------------------------------------------------------
  */

  const handleCloseTicket = async () => {
    try {
      toast.showLoadingToast('در حال بستن تیکت ...');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}/change-status`,
        {
          method: 'PUT',

          headers: {
            status: CLOSED,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Filed to update ticket status');
      }

      setTicket((prevTicket) => ({
        ...prevTicket,

        status: CLOSED,
      }));
    } catch (error) {
      console.error('Error Update Status : ', error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light dark:bg-background-dark'
      >
        <PageBackground />

        <div className='container relative z-10 mx-auto px-4 py-8 sm:px-6'>
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            className='mx-auto flex min-h-[320px] max-w-4xl flex-col items-center justify-center'
          >
            <span className='h-10 w-10 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />

            <p className='mt-4 text-xs font-bold text-subtext-light dark:text-subtext-dark'>
              در حال دریافت تیکت...
            </p>
          </SiteCard>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='پشتیبانی سمانه یوگا'
          title='گفتگوی'
          highlight='پشتیبانی'
          description='پیام‌ها و پاسخ‌های مربوط به درخواست خود را از این بخش دنبال کنید.'
          visualIcon={HiOutlineChatBubbleLeftRight}
          variant='compact'
        />

        <div className='mx-auto mt-6 max-w-5xl space-y-5'>
          {/* =====================
              Ticket header
          ====================== */}
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative overflow-hidden p-5 sm:p-6'
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-secondary/10 blur-[85px]'
            />

            <div className='relative z-10'>
              <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <p className='text-[10px] font-bold text-secondary'>
                    موضوع تیکت
                  </p>

                  <h1 className='mt-1 text-lg font-black leading-8 text-text-light sm:text-xl dark:text-text-dark'>
                    {ticket.title}
                  </h1>

                  <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    <span className='flex items-center gap-1.5 font-faNa'>
                      <HiOutlineClock size={14} />
                      ایجاد شده در {getShamsiDate(ticket.createdAt)} (
                      {getTimeFromDate(ticket.createdAt)})
                    </span>

                    <span className='flex items-center gap-1 font-faNa'>
                      <HiOutlineHashtag size={14} />

                      {ticket.id}
                    </span>
                  </div>
                </div>

                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  <TicketStatusBadge status={ticket.status} />

                  {ticket.status !== CLOSED && (
                    <SiteButton
                      type='button'
                      variant='outline'
                      size='sm'
                      startIcon={HiOutlineLockClosed}
                      onClick={handleCloseTicket}
                    >
                      بستن تیکت
                    </SiteButton>
                  )}
                </div>
              </div>
            </div>
          </SiteCard>

          {/* =====================
              Reply
          ====================== */}
          {ticket.status !== CLOSED && (
            <SiteCard
              variant='glass'
              padding='none'
              radius='lg'
              topLine
              className='overflow-hidden'
            >
              <div className='flex items-center gap-3 border-b border-black/5 px-5 py-4 sm:px-6 dark:border-white/10'>
                <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                  <HiOutlineChatBubbleBottomCenterText size={20} />
                </span>

                <div>
                  <h2 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                    ارسال پاسخ
                  </h2>

                  <p className='mt-0.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    پیام جدید خود را به این گفتگو اضافه کنید.
                  </p>
                </div>
              </div>

              <div className='px-5 py-5 sm:px-6'>
                <TextEditor
                  value={replyText}
                  onChange={setReplyText}
                  maxLength={2000}
                  label='متن پاسخ'
                  placeholder='متن پاسخ را بنویسید'
                  fullWidth
                  errorMessage={errorReplyText}
                  toolbarItems={[
                    ['bold', 'italic', 'underline', 'strike'],
                    [
                      {
                        align: [],
                      },
                      {
                        direction: 'rtl',
                      },
                    ],
                    [
                      {
                        list: 'ordered',
                      },
                      {
                        list: 'bullet',
                      },
                    ],
                    [
                      {
                        indent: '-1',
                      },
                      {
                        indent: '+1',
                      },
                    ],
                    ['link'],
                    ['clean'],
                  ]}
                />

                <div className='mt-4 flex justify-end'>
                  <SiteButton
                    type='button'
                    variant='primary'
                    size='md'
                    startIcon={HiOutlinePaperAirplane}
                    disabled={submitLoading}
                    onClick={submitReply}
                    className='w-full sm:w-auto'
                  >
                    {submitLoading ? 'در حال ارسال...' : 'ثبت پاسخ'}
                  </SiteButton>
                </div>
              </div>
            </SiteCard>
          )}

          {/* Closed */}
          {ticket.status === CLOSED && (
            <SiteCard
              variant='glass'
              padding='none'
              radius='md'
              className='flex items-start gap-3 px-4 py-4'
            >
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-600'>
                <HiOutlineLockClosed size={19} />
              </span>

              <div>
                <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                  این تیکت بسته شده است
                </h3>

                <p className='mt-1 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
                  امکان ارسال پاسخ جدید برای این تیکت وجود ندارد.
                </p>
              </div>
            </SiteCard>
          )}

          {/* =====================
              Conversation
          ====================== */}
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='overflow-hidden'
          >
            <div className='flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4 sm:px-6 dark:border-white/10'>
              <div className='flex items-center gap-3'>
                <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                  <HiOutlineChatBubbleLeftRight size={20} />
                </span>

                <div>
                  <h2 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                    تاریخچه گفتگو
                  </h2>

                  <p className='mt-0.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    پیام‌های این تیکت
                  </p>
                </div>
              </div>

              <span className='rounded-xl bg-secondary/10 px-2.5 py-1 font-faNa text-[9px] font-black text-secondary'>
                {((ticket?.ticketReplies?.length || 0) + 1).toLocaleString(
                  'fa-IR'
                )}{' '}
                پیام
              </span>
            </div>

            <div className='p-4 sm:p-5'>
              {ticket?.ticketReplies?.map((reply) => (
                <TicketItem
                  key={reply.id}
                  user={reply.user}
                  date={reply.createdAt}
                  content={reply.content}
                />
              ))}

              <TicketItem
                user={ticket.user}
                content={ticket.description}
                date={ticket.createdAt}
                divider={false}
              />
            </div>
          </SiteCard>

          <div className='flex justify-start'>
            <SiteButton
              href='/profile?active=4'
              variant='outline'
              size='md'
              startIcon={HiOutlineArrowRight}
            >
              بازگشت به تیکت‌ها
            </SiteButton>
          </div>
        </div>
      </div>
    </main>
  );
};

TicketPageContent.propTypes = {
  ticketId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
};

export default TicketPageContent;
