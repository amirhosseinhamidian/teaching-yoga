'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Ui/Input/Input';

const UserInformationCard = ({ className }) => {
  const { user } = useAuth();
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-surface-light p-4 sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-2 text-lg font-semibold md:text-xl'>تکمیل اطلاعات</h2>
      <Input
        value={firstname}
        onChange={setFirstname}
        placeholder='نام خود را وارد کنید'
        label='نام'
        className='bg-surface-light dark:bg-surface-dark'
      />
      <Input
        value={lastname}
        onChange={setLastname}
        placeholder='نام خانوادگی خود را وارد کنید'
        label='نام خانوادگی'
        className='bg-surface-light dark:bg-surface-dark'
      />
      <Input
        value={email}
        onChange={setEmail}
        placeholder='ایمیل خود را وارد کنید (اختیاری)'
        label='ایمیل'
        className='bg-surface-light dark:bg-surface-dark'
      />
    </div>
  );
};

UserInformationCard.propTypes = {
  className: PropTypes.string,
};

export default UserInformationCard;
