/* eslint-disable no-undef */
'use client'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { IoClose } from 'react-icons/io5'
import { createToastHandler } from '@/utils/toastHandler'
import { useTheme } from '@/contexts/ThemeContext'
import { getStringTime } from '@/utils/dateTimeHelper'
import Button from '@/components/Ui/Button/Button'
import Input from '@/components/Ui/Input/Input'
import DropDown from '@/components/Ui/DropDown/DropDwon'

const AddSessionModal = ({ onClose, termId, onSuccess }) => {
  const { isDark } = useTheme()
  const toast = createToastHandler(isDark)
  const [isLoading, setIsLoading] = useState(false)

  // ساخت جلسه جدید
  const [name, setName] = useState('')
  const [duration, setDuration] = useState('')
  const [sessionType, setSessionType] = useState(null)
  const sessionTypeOptions = [
    { value: 'VIDEO', label: 'ویدیو' },
    { value: 'AUDIO', label: 'صدا' },
  ]

  // دراپ‌دان جلسات موجود
  const [existingSessions, setExistingSessions] = useState([])
  const [selectedExistingSession, setSelectedExistingSession] = useState(null)

  // خطاها
  const [errorMessages, setErrorMessages] = useState({
    name: '',
    duration: '',
    sessionType: '',
  })

  // دریافت جلسات موجود
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sessions/get-all-name`
        )
        const data = await response.json()

        const formatted = data.map((s) => ({
          value: s.id,
          label: `${s.name} (${s.type === 'VIDEO' ? 'ویدیو' : 'صوتی'})`,
        }))

        setExistingSessions(formatted)
      } catch (err) {
        console.error(err)
      }
    }

    fetchSessions()
  }, [])

  // ساخت جلسه جدید
  const validateInputs = () => {
    let errors = {}

    if (!sessionType) {
      errors.sessionType = 'انتخاب نوع محتوا اجباری است.'
    }

    if (!name.trim()) {
      errors.name = 'عنوان نمی‌تواند خالی باشد.'
    }

    if (!duration || isNaN(duration) || Number(duration) <= 0) {
      errors.duration = 'مدت زمان باید معتبر باشد.'
    }

    setErrorMessages(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateNewSession = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر فرم صحیح نیست.')
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        name,
        duration: Number(duration),
        type: sessionType,
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const newSession = await response.json()

      if (!response.ok) {
        toast.showErrorToast(newSession.error || 'خطا در ساخت جلسه')
        return
      }

      // اتصال به ترم
      await attachSessionToTerm(newSession.id)
    } catch (err) {
      console.error(err)
      toast.showErrorToast('خطای غیرمنتظره')
    } finally {
      setIsLoading(false)
    }
  }

  // اتصال جلسه موجود یا جدید به ترم
  const attachSessionToTerm = async (sessionId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms/${termId}/sessions/attach`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.showErrorToast(data.error || 'خطا در افزودن جلسه')
        return
      }

      toast.showSuccessToast('جلسه با موفقیت اضافه شد')
      onSuccess(data)
      onClose()
    } catch (error) {
      console.error(error)
      toast.showErrorToast('خطای افزودن جلسه')
    }
  }

  // افزودن یک جلسه موجود
  const handleAttachExistingSession = async () => {
    if (!selectedExistingSession) {
      toast.showErrorToast('لطفاً یک جلسه انتخاب کنید.')
      return
    }

    await attachSessionToTerm(selectedExistingSession)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        {/* HEADER */}
        <div className='flex items-center justify-between border-b pb-3'>
          <h3 className='text-lg font-semibold'>افزودن جلسه</h3>
          <button onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        {/* بخش انتخاب سشن موجود */}
        <div className='mt-6'>
          <h4 className='mb-4 font-semibold'>📂 افزودن جلسه موجود</h4>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <DropDown
              options={existingSessions}
              label='انتخاب جلسه'
              value={selectedExistingSession}
              onChange={setSelectedExistingSession}
              placeholder='یک جلسه انتخاب کنید'
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
            />

            <Button
              className='mt-4 self-end justify-self-start'
              onClick={handleAttachExistingSession}
              disabled={!selectedExistingSession}
            >
              افزودن جلسه انتخاب شده به ترم
            </Button>
          </div>
        </div>

        {/* خط جدا کننده */}
        <div className='my-8 border-t border-gray-300 dark:border-gray-700'></div>

        {/* بخش ساخت جلسه جدید */}
        <div className='mt-6'>
          <h4 className='mb-4 font-semibold'>➕ ساخت جلسه جدید</h4>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <DropDown
              options={sessionTypeOptions}
              label='نوع جلسه'
              value={sessionType}
              onChange={setSessionType}
              errorMessage={errorMessages.sessionType}
              placeholder='انتخاب نوع جلسه'
              fullWidth
            />

            <Input
              label='عنوان جلسه'
              value={name}
              onChange={setName}
              errorMessage={errorMessages.name}
            />

            <div>
              <Input
                label='مدت زمان (ثانیه)'
                value={duration}
                onChange={setDuration}
                errorMessage={errorMessages.duration}
              />

              {duration && (
                <span className='font-faNa text-green'>
                  {getStringTime(duration)}
                </span>
              )}
            </div>

            <Button
              onClick={handleCreateNewSession}
              isLoading={isLoading}
              className='self-end justify-self-start'
            >
              ساخت جلسه جدید و افزودن به ترم
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

AddSessionModal.propTypes = {
  termId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

export default AddSessionModal
