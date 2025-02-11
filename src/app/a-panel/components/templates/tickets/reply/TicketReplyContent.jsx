/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { ANSWERED, IN_PROGRESS, PENDING } from '@/constants/ticketStatus';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import Button from '@/components/Ui/Button/Button';
import TicketItem from '@/components/templates/ticket/TicketItem';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';

const TicketReplyContent = ({ ticketId, ticket, setTicket }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [replyText, setReplyText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorReplyText, setErrorReplyText] = useState('');

  const handleStatusChange = async (newStatus) => {
    try {
      toast.showLoadingToast('در حال تغییر وضعیت');
      const response = await fetch('/api/admin/ticket/change-status', {
        method: 'PUT',
        headers: {
          id: ticketId,
          status: newStatus,
        },
      });

      if (response.ok) {
        toast.showSuccessToast('وضعیت با موفقیت بروز شد.');
        setTicket((prevTicket) => ({
          ...prevTicket,
          status: newStatus,
        }));
      } else {
        toast.showErrorToast('خطا در تغییر وضعیت تیکت');
      }
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در تغییر وضعیت تیکت');
    }
  };

  useEffect(() => {
    if (ticket?.status === PENDING) {
      handleStatusChange(IN_PROGRESS);
    }
  }, [ticketId]);

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
        status: ANSWERED,
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
        throw new Error('Filed to create reply');
      }
      const data = await response.json();
      setReplyText('');
      setTicket((prevTicket) => ({
        ...prevTicket,
        ticketReplies: [data, ...prevTicket.ticketReplies],
        status: ANSWERED,
      }));
      toast.showSuccessToast('پاسخ تیکت ثبت شد.');
    } catch (error) {
      console.error('Error to Send Reply Create Request : ', error);
      toast.showErrorToast('خطا در ارسال درخواست، لطفا بعدا تلاش کنید.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <div className='mt-2 flex flex-wrap items-start justify-between gap-6'>
        <div className='flex flex-nowrap items-center gap-2'>
          <Image
            src={
              ticket.user?.avatar
                ? ticket.user.avatar
                : '/images/default-profile.png'
            }
            alt={ticket.user.username}
            className='h-12 w-12 rounded-full md:h-14 md:w-14 xl:h-20 xl:w-20'
            width={96}
            height={96}
          />
          <div className='flex flex-col text-xs sm:text-sm'>
            <h4 className='whitespace-nowrap'>
              {ticket.user?.firstname} {ticket.user?.lastname}
            </h4>
            <h4>{ticket.user.username}</h4>
            <h4 className='font-faNa text-subtext-light dark:text-subtext-dark'>
              {ticket.user.phone}
            </h4>
            <h4 className='whitespace-nowrap font-faNa'>
              تاریخ آخرین بروزرسانی: {getTimeFromDate(ticket.updatedAt)}
              {'  '}
              {getShamsiDate(ticket.updatedAt)}
            </h4>
          </div>
        </div>
        <div>
          <div className='rounded-xl border border-subtext-light px-4 py-2 md:px-6 md:py-3 dark:border-subtext-dark'>
            <p className='text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
              موضوع
            </p>
            <p className='text-xs xs:text-sm sm:text-base'>{ticket.title}</p>
          </div>
          <SimpleDropdown
            className={`text-xs md:text-sm ${ticket.status === 'OPEN' && 'text-blue'} ${ticket.status === 'ANSWERED' && 'text-green dark:text-accent'} ${ticket.status === 'IN_PROGRESS' && 'text-secondary'} ${ticket.status === 'PENDING' && 'text-red'}`}
            options={[
              { label: 'در انتظار بررسی', value: 'PENDING' },
              { label: 'در حال بررسی', value: 'IN_PROGRESS' },
              { label: 'پاسخ داده شده', value: 'ANSWERED' },
              { label: 'باز', value: 'OPEN' },
              { label: 'بسته شده', value: 'CLOSED' },
            ]}
            value={ticket.status}
            onChange={(newStatus) => handleStatusChange(newStatus)}
          />
        </div>
      </div>
      <div>
        <div>
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
        </div>
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
  );
};

TicketReplyContent.propTypes = {
  ticket: PropTypes.object.isRequired,
  setTicket: PropTypes.func.isRequired,
  ticketId: PropTypes.number.isRequired,
};

export default TicketReplyContent;
