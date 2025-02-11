/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import Button from '@/components/Ui/Button/Button';
import TicketItem from './TicketItem';
import { ANSWERED, CLOSED, OPEN } from '@/constants/ticketStatus';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';

const TicketPageContent = ({ ticketId }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [ticket, setTicket] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorReplyText, setErrorReplyText] = useState('');

  const fetchTicket = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}`,
        {
          cache: 'no-cache',
          method: 'GET',
        },
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
          },
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
        },
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
        },
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

  const getStatusTitle = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <h5 className='rounded-full bg-secondary bg-opacity-10 px-3 py-1 text-center text-2xs text-secondary sm:text-xs md:text-sm'>
            در انتظار بررسی
          </h5>
        );
      case 'IN_PROGRESS':
        return (
          <h5 className='rounded-full bg-blue bg-opacity-10 px-3 py-1 text-center text-2xs text-blue sm:text-xs md:text-sm'>
            در حال بررسی
          </h5>
        );
      case 'ANSWERED':
      case 'OPEN':
        return (
          <h5 className='rounded-full bg-green bg-opacity-10 px-3 py-1 text-center text-2xs text-green sm:text-xs md:text-sm dark:text-accent'>
            باز
          </h5>
        );
      case 'CLOSED':
        return (
          <h5 className='rounded-full bg-purple-600 bg-opacity-10 px-3 py-1 text-center text-2xs text-purple-600 sm:text-xs md:text-sm'>
            بسته شده
          </h5>
        );
      default:
        return (
          <h5 className='rounded-full bg-opacity-10 px-3 py-1 text-center text-2xs sm:text-xs md:text-sm'>
            وضعیت نامشخص
          </h5>
        );
    }
  };

  return (
    <div className='container overflow-x-hidden py-10'>
      {isLoading ? (
        <></>
      ) : (
        <div className='mx-auto overflow-x-hidden lg:w-4/5'>
          {ticket.status !== CLOSED && (
            <div className='mb-4 flex justify-end'>
              <OutlineButton
                className='text-xs sm:text-sm lg:text-base'
                onClick={handleCloseTicket}
              >
                بستن تیکت
              </OutlineButton>
            </div>
          )}
          <div className='overflow-x-hidden rounded-xl bg-surface-light px-4 py-6 dark:bg-surface-dark'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h1 className='mb-2 text-base sm:text-lg md:text-xl xl:text-2xl'>
                  {ticket.title}
                </h1>
                <p className='font-faNa text-2xs font-thin text-subtext-light xs:text-xs md:text-sm dark:text-subtext-dark'>{`ایجاد شده در ${getShamsiDate(ticket.createdAt)} (${getTimeFromDate(ticket.createdAt)})`}</p>
              </div>
              <div>
                <h5 className='mb-2 font-faNa text-sm font-thin text-subtext-light xs:text-base md:text-lg dark:text-subtext-dark'>
                  شماره: {ticket.id}
                </h5>
                {getStatusTitle(ticket.status)}
              </div>
            </div>
            {ticket.status !== CLOSED && (
              <>
                <div className='mt-5 border-b border-gray-300 dark:border-gray-600'></div>
                <div className='flex flex-col items-end gap-4 py-3 sm:flex-row sm:px-6'>
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
                      [{ align: [] }, { direction: 'rtl' }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      ['link'],
                      ['clean'],
                    ]}
                  />
                  <Button
                    shadow
                    className='whitespace-nowrap text-xs sm:text-sm md:text-base'
                    isLoading={submitLoading}
                    onClick={submitReply}
                  >
                    ثبت پاسخ
                  </Button>
                </div>
              </>
            )}
            <div className='mt-5 border-b border-gray-300 dark:border-gray-600'></div>
            {ticket?.ticketReplies.map((reply) => (
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
              className='pb-6'
            />
          </div>
        </div>
      )}
    </div>
  );
};

TicketPageContent.propTypes = {
  ticketId: PropTypes.number.isRequired,
};

export default TicketPageContent;
