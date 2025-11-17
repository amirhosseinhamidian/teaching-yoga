/* eslint-disable no-undef */
'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { IoClose } from 'react-icons/io5'
import { createToastHandler } from '@/utils/toastHandler'
import { useTheme } from '@/contexts/ThemeContext'
import Button from '@/components/Ui/Button/Button'
import Input from '@/components/Ui/Input/Input'
import DropDown from '@/components/Ui/DropDown/DropDwon'
import DatePicker, { DateObject } from 'react-multi-date-picker'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import 'react-multi-date-picker/styles/backgrounds/bg-dark.css'
import TextArea from '@/components/Ui/TextArea/TextArea'
import Switch from '@/components/Ui/Switch/Switch'

const AddEditDiscountCodeModal = ({
  onClose,
  discountCode,
  onSuccess,
  courseOptions,
}) => {
  const { isDark } = useTheme()
  const toast = createToastHandler(isDark)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState(discountCode?.title || '')
  const [code, setCode] = useState(discountCode?.code || '')
  const [discountPercent, setDiscountPercent] = useState(
    discountCode?.discountPercent || ''
  )
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    discountCode?.maxDiscountAmount || ''
  )
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(
    discountCode?.minPurchaseAmount || ''
  )
  const [usageLimit, setUsageLimit] = useState(discountCode?.usageLimit || '')
  const [expiryDate, setExpiryDate] = useState(
    discountCode?.expiryDate && new DateObject(discountCode.expiryDate)
  )
  const [courseId, setCourseId] = useState(discountCode?.courseId || null)
  const [description, setDescription] = useState(
    discountCode?.description || ''
  )
  const [isActive, setIsActive] = useState(discountCode?.isActive || false)

  const [errorMessages, setErrorMessages] = useState({
    title: '',
    code: '',
    discountPercent: '',
    maxDiscountAmount: '',
    minPurchaseAmount: '',
    usageLimit: '',
    expiryDate: '',
    course: '',
    description: '',
  })

  const expiryDatePickerHandler = (event) => {
    setExpiryDate(event)
  }

  const validateInputs = () => {
    let errors = {}

    if (!title.trim()) {
      errors.title = 'عنوان نمی‌تواند خالی باشد.'
    }

    if (title.trim().length < 3) {
      errors.title = 'عنوان نمی‌تواند کمتر از سه کارکتر باشد.'
    }

    if (!code.trim()) {
      errors.code = 'کد نمی‌تواند خالی باشد.'
    }

    if (code.trim().length < 3) {
      errors.code = 'کد نمی‌تواند کمتر از سه کارکتر باشد.'
    }

    const englishCodeRegex = /^[a-zA-Z0-9]+$/ // فقط حروف انگلیسی و اعداد
    if (!englishCodeRegex.test(code.trim())) {
      errors.code = 'کد باید فقط شامل حروف انگلیسی و اعداد باشد.'
    }

    if (!discountPercent) {
      errors.discountPercent = 'درصد تخفیف نمی‌تواند خالی باشد.'
    } else if (!/^\d+$/.test(discountPercent)) {
      errors.discountPercent = 'درصد تخفیف باید یک عدد صحیح باشد.'
    } else {
      const discount = parseInt(discountPercent, 10)
      if (discount < 0 || discount > 100) {
        errors.discountPercent = 'درصد تخفیف باید عددی بین ۰ تا ۱۰۰ باشد.'
      }
    }

    if (maxDiscountAmount && !/^\d+$/.test(maxDiscountAmount)) {
      errors.maxDiscountAmount = 'سقف مبلغ تخفیف باید یک عدد صحیح باشد.'
    }

    if (minPurchaseAmount && !/^\d+$/.test(minPurchaseAmount)) {
      errors.minPurchaseAmount = 'حداقل مبلغ خرید باید یک عدد صحیح باشد.'
    }

    if (usageLimit && !/^\d+$/.test(usageLimit)) {
      errors.usageLimit = 'سقف تعداد استفاده باید یک عدد صحیح باشد.'
    }

    if (courseId === -1) {
      setCourseId(null)
    }

    if (!expiryDate) {
      errors.expiryDate = 'تاریخ انقضا نمی‌تواند خالی باشد.'
    } else {
      const expiry = new Date(expiryDate)
      const now = new Date()

      if (isNaN(expiry.getTime())) {
        errors.expiryDate = 'تاریخ انقضا نامعتبر است.'
      } else if (expiry <= now) {
        errors.expiryDate = 'تاریخ انقضا باید تاریخی در آینده باشد.'
      }
    }

    setErrorMessages(errors)

    // Return true if no errors exist
    return Object.keys(errors).length === 0
  }
  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید')
      return
    }
    const payload = {
      title,
      code,
      discountPercent,
      maxDiscountAmount,
      usageLimit,
      minPurchaseAmount,
      expiryDate,
      description,
      courseId,
      isActive,
    }

    const method = discountCode ? 'PUT' : 'POST'
    const url = discountCode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discount-code?id=${discountCode.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discount-code`

    try {
      setIsLoading(true)
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const newDiscountCode = await response.json()
        onSuccess(newDiscountCode.data)
        toast.showSuccessToast(
          discountCode
            ? 'کد تخفیف با موفقیت ویرایش شد.'
            : 'کد تخفیف با موفقیت ساخته شد'
        )
      } else {
        const errorText = await response.json()
        console.error('Server error response:', errorText.message)
        toast.showErrorToast(errorText.message || 'خطای رخ داده')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.showErrorToast('خطای غیرمنتظره')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative max-h-screen w-11/12 overflow-y-auto rounded-xl bg-surface-light p-6 xs:w-5/6 sm:w-2/3 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {discountCode ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف'}
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        <div className='my-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='عنوان'
            placeholder='عنوان کد تخفیف را وارد کنید'
            value={title}
            onChange={setTitle}
            errorMessage={errorMessages.title}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
          <Input
            label='کد (انگلیسی)'
            placeholder='کد تخفیف را بنویسید'
            isUppercase
            isShowCounter
            maxLength={20}
            value={code}
            onChange={setCode}
            errorMessage={errorMessages.code}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        <div className='my-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='درصد تخفیف'
            placeholder='درصد تخفیف را وارد کنید'
            value={discountPercent}
            onChange={setDiscountPercent}
            errorMessage={errorMessages.discountPercent}
            type='number'
            maxLength={3}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
          <Input
            label='سقف مبلغ تخفیف (تومان)'
            placeholder='حداکثر مبلغ کد تخفیف را بنویسید (اختیاری)'
            value={maxDiscountAmount}
            onChange={setMaxDiscountAmount}
            errorMessage={errorMessages.maxDiscountAmount}
            thousandSeparator={true}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        <div className='my-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='حداقل مبلغ استفاده (تومان)'
            placeholder='حداقل مبلغ استفاده از کد تخفیف را وارد کنید (اختیاری)'
            value={minPurchaseAmount}
            onChange={setMinPurchaseAmount}
            errorMessage={errorMessages.minPurchaseAmount}
            thousandSeparator={true}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
          <Input
            label='تعداد استفاده'
            placeholder='تعداد مجاز استفاده از این کد تخفیف را وارد کنید'
            value={usageLimit}
            onChange={setUsageLimit}
            errorMessage={errorMessages.usageLimit}
            type='number'
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        <div className='my-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <div className='w-full'>
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              تاریخ انقضا
            </label>
            <div
              className={`rounded-xl border border-solid ${errorMessages.expiryDate ? 'border-red focus:ring-red' : 'border-accent focus:ring-accent'} bg-background-light transition duration-200 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 dark:bg-surface-dark placeholder:dark:text-subtext-dark`}
            >
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                calendarPosition='bottom-right'
                value={expiryDate}
                onChange={expiryDatePickerHandler}
                className='bg-dark'
                inputClass='custom-input-datepicker'
                placeholder='انتخاب تاریخ انقضا'
              />
            </div>
            {errorMessages.expiryDate && (
              <p className={`mt-1 text-xs text-red`}>
                *{errorMessages.expiryDate}
              </p>
            )}
          </div>
          <DropDown
            label='انتخاب دوره (اختیاری)'
            placeholder='یک دوره برای استفاده از کد تخفیف انتخاب کنید'
            value={courseId}
            onChange={setCourseId}
            options={courseOptions}
            errorMessage={errorMessages.course}
            fullWidth
            optionClassName='max-h-48 overflow-y-auto custom-scrollbar'
            className='bg-surface-light px-4 text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        <div className='my-4 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <TextArea
            label='توضیحات (اختیاری)'
            placeholder='توضیحی برای این کد تخفیف بنویسید'
            value={description}
            onChange={setDescription}
            errorMessage={errorMessages.description}
            rows={2}
            maxLength={200}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />
          <div>
            <Switch
              label='آیا کد تخفیف از همین لحظه فعال باشد؟'
              checked={isActive}
              onChange={setIsActive}
              className='h-full flex-row-reverse justify-center gap-3'
              size='small'
            />
          </div>
        </div>

        <Button
          shadow
          onClick={handleFormSubmit}
          className='mt-4 text-sm sm:text-base'
          isLoading={isLoading}
        >
          {discountCode ? 'بروزرسانی' : 'ثبت کد تخفیف'}
        </Button>
      </div>
    </div>
  )
}

AddEditDiscountCodeModal.propTypes = {
  discountCode: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  courseOptions: PropTypes.array.isRequired,
}

export default AddEditDiscountCodeModal
