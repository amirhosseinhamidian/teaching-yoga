/* eslint-disable no-undef */
'use client'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@/components/Ui/Button/Button'
import Input from '@/components/Ui/Input/Input'
import { IoClose } from 'react-icons/io5'
import { getStringTime } from '@/utils/dateTimeHelper'
import { createToastHandler } from '@/utils/toastHandler'
import { useTheme } from '@/contexts/ThemeContext'
import DropDown from '@/components/Ui/DropDown/DropDwon'
import { PUBLIC, PURCHASED, REGISTERED } from '@/constants/videoAccessLevel'

const EditSessionModal = ({ onClose, session, onSuccess }) => {
  const { isDark } = useTheme()
  const toast = createToastHandler(isDark)

  const [isLoading, setIsLoading] = useState(false)

  // ===============================
  // مقداردهی اولیه با ساختار جدید جلسه
  // ===============================

  const [name, setName] = useState(session?.sessionName || session?.name || '')

  const [duration, setDuration] = useState(
    session?.sessionDuration || session?.duration || ''
  )

  const [accessLevel, setAccessLevel] = useState(
    session.videoAccessLevel ||
      session.audioAccessLevel ||
      session?.video?.accessLevel ||
      session?.audio?.accessLevel ||
      ''
  )

  // ===============================
  // لیست ترم‌های قبلی → اکنون terms[]
  // ===============================
  const initialSelectedTerms = session?.terms?.map((t) => t.termId) || []

  const [selectedTerms, setSelectedTerms] = useState(initialSelectedTerms)
  const [termOptions, setTermOptions] = useState([])

  const [errorMessages, setErrorMessages] = useState({
    name: '',
    accessLevel: '',
    duration: '',
  })

  const accessVideoOptions = [
    { label: 'عمومی', value: PUBLIC },
    { label: 'ثبت نام', value: REGISTERED },
    { label: 'خریداری', value: PURCHASED },
  ]

  // ===============================
  // دریافت ترم‌ها
  // ===============================
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/terms`
        )
        if (!response.ok) throw new Error('Failed to fetch terms')

        const data = await response.json()

        const formatted = data.map((term) => ({
          value: term.id,
          label: `${term.name} - ${term.sessionCount} جلسه - ${term.price.toLocaleString(
            'fa-IR'
          )} تومان`,
        }))

        setTermOptions(formatted)
      } catch (err) {
        console.error(err)
        toast.showErrorToast(err.message)
      }
    }

    fetchTerms()
  }, [])

  // ===============================
  // افزودن ترم از Dropdown
  // ===============================
  const handleSelectTerm = (termId) => {
    if (!selectedTerms.includes(termId)) {
      setSelectedTerms((prev) => [...prev, termId])
    }
  }

  // ===============================
  // حذف ترم
  // ===============================
  const removeTerm = (termId) => {
    setSelectedTerms((prev) => prev.filter((id) => id !== termId))
  }

  // ===============================
  // اعتبارسنجی
  // ===============================
  const validateInputs = () => {
    let errors = {}

    if (!name.trim()) errors.name = 'عنوان نمی‌تواند خالی باشد.'
    if (!accessLevel) errors.accessLevel = 'سطح دسترسی را مشخص کنید.'
    if (!duration || isNaN(duration) || duration <= 0)
      errors.duration = 'مدت زمان معتبر نیست.'

    setErrorMessages(errors)
    return Object.keys(errors).length === 0
  }

  // ===============================
  // درخواست بروزرسانی
  // ===============================
  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('لطفاً مقادیر را درست وارد کنید.')
      return
    }

    setIsLoading(true)

    const payload = {
      sessionId: session.sessionId || session.id,
      name,
      duration: Number(duration),
      accessLevel,
      type: session.type,
      termIds: selectedTerms, // 🔥 آرایه ترم‌ها
    }

    try {
      const response = await fetch(`/api/admin/sessions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast.showSuccessToast('جلسه با موفقیت بروزرسانی شد!')
        onSuccess(data.updatedSession)
      } else {
        const err = await response.json()
        toast.showErrorToast(err.error || 'خطا در بروزرسانی')
      }
    } catch (error) {
      console.error(error)
      toast.showErrorToast('خطای غیرمنتظره')
    } finally {
      setIsLoading(false)
    }
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b pb-3'>
          <h3 className='text-lg font-semibold'>ویرایش جلسه</h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose size={24} />
          </button>
        </div>

        {/* ترم‌ها */}
        <div className='mt-6'>
          <DropDown
            options={termOptions}
            placeholder='ترم جدید را انتخاب کنید'
            value={null}
            onChange={handleSelectTerm}
            label='افزودن ترم'
            optionClassName='max-h-80 overflow-y-auto custom-scrollbar'
            fullWidth
          />

          <div className='mt-4 flex flex-wrap gap-4'>
            {selectedTerms.length === 0 && (
              <p className='text-sm text-gray-500'>هیچ ترمی انتخاب نشده</p>
            )}

            {selectedTerms.map((tid) => {
              const term = termOptions.find((t) => t.value === tid)

              return (
                <div
                  key={tid}
                  className='flex w-fit items-center gap-4 rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-700'
                >
                  <span>{term?.label || `ترم ${tid}`}</span>
                  <button
                    onClick={() => removeTerm(tid)}
                    className='text-red-500'
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* سطح دسترسی */}
        <div className='grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2'>
          <DropDown
            options={accessVideoOptions}
            placeholder='سطح دسترسی'
            value={accessLevel}
            onChange={setAccessLevel}
            label='دسترسی محتوا'
            fullWidth
            errorMessage={errorMessages.accessLevel}
          />
        </div>

        {/* عنوان + زمان */}
        <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='عنوان جلسه'
            placeholder='عنوان جلسه'
            value={name}
            onChange={setName}
            errorMessage={errorMessages.name}
          />

          <div>
            <Input
              label='مدت زمان (ثانیه)'
              placeholder='مدت زمان'
              value={duration}
              onChange={setDuration}
              errorMessage={errorMessages.duration}
              thousandSeparator
            />
            <p className='mr-2 mt-1 font-faNa text-green'>
              {duration && getStringTime(duration)}
            </p>
          </div>
        </div>

        <Button
          onClick={handleFormSubmit}
          className='mt-8'
          isLoading={isLoading}
        >
          بروزرسانی
        </Button>
      </div>
    </div>
  )
}

EditSessionModal.propTypes = {
  session: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

export default EditSessionModal
