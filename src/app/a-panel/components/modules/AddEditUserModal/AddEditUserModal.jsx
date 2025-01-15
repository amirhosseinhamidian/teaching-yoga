/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { ADMIN, USER } from '@/constants/userRole';

const AddEditUserModal = ({ onClose, onSuccess, editUser }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState(editUser?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(editUser?.phone || '');
  const [firstname, setFirstname] = useState(editUser?.firstname || '');
  const [lastname, setLastname] = useState(editUser?.lastname || '');
  const [role, setRole] = useState(editUser?.role || '');
  const [errorMessages, setErrorMessages] = useState({
    username: '',
    phoneNumber: '',
    firstname: '',
    lastname: '',
    role: '',
  });

  const userRoleOptions = [
    { label: 'ادمین', value: ADMIN },
    { label: 'کاربر عادی', value: USER },
  ];

  const validateInputs = () => {
    let errors = {};

    // Validation for username (required)
    if (!username || username.trim() === '') {
      errors.username = 'نام کاربری الزامی است.';
    }

    // Validation for phone number (required)
    const phoneRegex = /^09\d{9}$/; // Iranian phone number pattern
    if (!phoneNumber || phoneNumber.trim() === '') {
      errors.phoneNumber = 'شماره موبایل الزامی است.';
    } else if (!phoneRegex.test(phoneNumber)) {
      errors.phoneNumber = 'شماره موبایل وارد شده صحیح نیست.';
    }

    // Validation for firstname (optional, minimum 2 characters)
    if (firstname && firstname.trim() !== '') {
      if (firstname.trim().length < 2) {
        errors.firstname = 'نام باید حداقل 2 کاراکتر باشد.';
      }
    }

    // Validation for lastname (optional, minimum 3 characters)
    if (lastname && lastname.trim() !== '') {
      if (lastname.trim().length < 3) {
        errors.lastname = 'نام خانوادگی باید حداقل 3 کاراکتر باشد.';
      }
    }

    // Validation for role (required)
    const validRoles = userRoleOptions.map((option) => option.value);
    if (!role || !validRoles.includes(role)) {
      errors.role = 'لطفاً یک نقش معتبر انتخاب کنید.';
    }

    // Set errors state
    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }

    const payload = {
      phoneNumber,
      firstname,
      lastname,
      role,
    };

    if (editUser) {
      payload.newUsername = username;
    } else {
      payload.username = username;
    }

    setIsLoading(true);
    try {
      const method = editUser ? 'PUT' : 'POST';
      const url = editUser
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/${editUser.username}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        onSuccess(updatedUser);
        toast.showSuccessToast(
          editUser
            ? 'کاربر با موفقیت ویرایش شد'
            : 'کاربر جدید با موفقیت ثبت شد',
        );
      } else {
        const errorData = await response.json();
        if (errorData.field) {
          toast.showErrorToast(`${errorData.error}`);
          if (errorData.field === 'phone') {
            setErrorMessages({ phoneNumber: errorData.error });
          } else {
            setErrorMessages({ username: errorData.error });
          }
        } else {
          // پیام پیش‌فرض در صورت نبودن جزئیات
          toast.showErrorToast('خطایی رخ داده است');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-surface-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {editUser ? 'ویرایش کاربر' : 'ثبت کاربر جدید'}
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='نام کاربری'
            placeholder='نام کاربری منحصر به فرد وارد کنید'
            value={username}
            onChange={setUsername}
            errorMessage={errorMessages.username}
            maxLength={25}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <Input
            label='شماره موبایل'
            placeholder='شماره موبایل کاربر را وارد کنید'
            value={phoneNumber}
            onChange={setPhoneNumber}
            errorMessage={errorMessages.phoneNumber}
            type='number'
            maxLength={11}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
        </div>
        <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <Input
            label='نام'
            placeholder='نام را وارد کنید'
            value={firstname}
            onChange={setFirstname}
            errorMessage={errorMessages.firstname}
            maxLength={20}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <Input
            label='نام خانوادگی'
            placeholder='  نام خانوادگی را وارد کنید'
            value={lastname}
            onChange={setLastname}
            errorMessage={errorMessages.lastname}
            thousandSeparator={true}
            maxLength={30}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
        </div>
        <div className='my-10 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <DropDown
            options={userRoleOptions}
            placeholder='نقش کاربر را مشخص کنید'
            value={role}
            onChange={setRole}
            errorMessage={errorMessages.role}
            className='mt-4 bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
        </div>
        <Button
          onClick={handleFormSubmit}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
        >
          {editUser ? 'ویرایش کاربر' : 'ثبت کاربر'}
        </Button>
      </div>
    </div>
  );
};

AddEditUserModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  editUser: PropTypes.object,
};

export default AddEditUserModal;
