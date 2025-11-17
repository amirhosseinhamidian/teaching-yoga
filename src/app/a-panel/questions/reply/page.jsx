'use client'
/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import QuestionReplyContent from '../../components/templates/questions/reply/QuestionReplyContent'

const fetchQuestion = async (questionId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/question/${questionId}`,
      {
        cache: 'no-cache',
        method: 'GET',
      }
    )

    if (!response.ok) {
      throw new Error('Failed to Fetch Ticket Data!')
    }
    return await response.json()
  } catch (error) {
    console.error('Error Fetch ticket: ', error)
  }
}

function QuestionReplyPage() {
  const searchParams = useSearchParams()
  const questionId = searchParams.get('questionId')
  const [question, setQuestion] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getQuestion = async () => {
      const data = await fetchQuestion(questionId)
      setQuestion(data)
      setIsLoading(false)
    }

    if (questionId) {
      getQuestion()
    }
  }, [questionId])

  if (isLoading) {
    return <div>در حال بارگذاری...</div>
  }

  if (!question) {
    return (
      <div className='font-faNa'>
        اطلاعات برای سوال با ایدی {questionId} یافت نشد!
      </div>
    )
  }

  return (
    <div>
      <h1 className='my-2 text-lg font-semibold md:my-3 md:text-2xl'>
        جزییات و پاسخ به سوال
      </h1>
      <QuestionReplyContent
        questionId={questionId}
        question={question}
        setQuestion={setQuestion}
      />
    </div>
  )
}

export default QuestionReplyPage
