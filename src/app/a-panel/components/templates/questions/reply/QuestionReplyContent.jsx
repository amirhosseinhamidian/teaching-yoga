/* eslint-disable no-undef */
'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Image from 'next/image'
import { createToastHandler } from '@/utils/toastHandler'
import { useTheme } from '@/contexts/ThemeContext'
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper'
import Button from '@/components/Ui/Button/Button'
import TextEditor from '@/components/Ui/TextEditor/TextEditor'

const QuestionReplyContent = ({ questionId, question, setQuestion }) => {
  const { isDark } = useTheme()
  const toast = createToastHandler(isDark)
  const [replyText, setReplyText] = useState(question?.answerText || '')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [errorReplyText, setErrorReplyText] = useState('')

  const submitReply = async () => {
    if (!replyText.trim()) {
      setErrorReplyText('پاسخ نباید خالی باشد.')
      return
    }
    if (replyText.trim().length < 5) {
      setErrorReplyText('حداقل پاسخ ۵ کارکتر باید باشد.')
      return
    }
    setErrorReplyText('')

    try {
      setSubmitLoading(true)
      const payload = {
        id: questionId,
        answerText: replyText,
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/question`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        throw new Error('Filed to create reply')
      }
      const data = await response.json()
      setQuestion((prev) => ({
        ...prev,
        answerText: data.question.answerText,
        isAnswered: data.question.isAnswered,
        answeredAt: data.question.answeredAt,
        updatedAt: data.question.updatedAt,
      }))

      toast.showSuccessToast('پاسخ سوال ثبت شد.')
    } catch (error) {
      console.error('Error to Send Reply Create Request : ', error)
      toast.showErrorToast('خطا در ارسال درخواست، لطفا بعدا تلاش کنید.')
    } finally {
      setSubmitLoading(false)
    }
  }
  return (
    <div>
      <div className='mt-2 flex flex-wrap items-start justify-between gap-6'>
        <div className='flex flex-nowrap items-center gap-2'>
          <Image
            src={
              question.user?.avatar
                ? question.user.avatar
                : '/images/default-profile.png'
            }
            alt={question.user.username}
            className='h-12 w-12 rounded-full md:h-14 md:w-14 xl:h-20 xl:w-20'
            width={96}
            height={96}
          />
          <div className='flex flex-col text-xs sm:text-sm'>
            <h4 className='whitespace-nowrap'>
              {question.user?.firstname} {question.user?.lastname}
            </h4>
            <h4>{question.user.username}</h4>
            <h4 className='font-faNa text-subtext-light dark:text-subtext-dark'>
              {question.user?.phone}
            </h4>
            <h4 className='whitespace-nowrap font-faNa'>
              تاریخ آخرین بروزرسانی: {getTimeFromDate(question.updatedAt)}
              {'  '}
              {getShamsiDate(question.updatedAt)}
            </h4>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <div className='rounded-xl border border-subtext-light px-4 py-2 text-2xs text-subtext-light xs:text-xs md:text-sm dark:border-subtext-dark dark:text-subtext-dark'>
            دوره : {question.course.title}
          </div>
          <div className='rounded-xl border px-4 py-2 text-xs dark:border-subtext-dark dark:text-subtext-dark'>
            ترم : {'  '}
            {question.session.terms?.length > 0
              ? question.session.terms.map((t) => t.termName).join('، ')
              : '---'}
          </div>
          <div className='rounded-xl border border-subtext-light px-4 py-2 text-2xs text-subtext-light xs:text-xs md:text-sm dark:border-subtext-dark dark:text-subtext-dark'>
            جلسه : {question.session.name}
          </div>
        </div>
      </div>
      <div>
        <div className='mt-5 border-b border-gray-300 dark:border-gray-600'></div>
        <div className='mx-auto md:w-4/5 lg:w-2/3'>
          <div className='mt-6 rounded-xl border border-subtext-light px-4 py-2 md:px-6 md:py-3 dark:border-subtext-dark'>
            <p className='mb-2 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
              سوال کاربر
            </p>
            <p className='mb-3 text-xs xs:text-sm sm:text-base'>
              {question.questionText}
            </p>
          </div>
          <div>
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
                  [{ align: [] }, { direction: 'rtl' }], // تنظیم جهت متن
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  [{ color: [] }, { background: [] }],
                  ['link'],
                  ['clean'], // پاک کردن فرمت
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
        </div>
      </div>
    </div>
  )
}

QuestionReplyContent.propTypes = {
  questionId: PropTypes.string.isRequired,
  question: PropTypes.object.isRequired,
  setQuestion: PropTypes.func.isRequired,
}

export default QuestionReplyContent
