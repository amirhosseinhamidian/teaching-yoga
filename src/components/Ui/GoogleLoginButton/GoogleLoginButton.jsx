import React from 'react';
import { GrGoogle } from 'react-icons/gr';
import Button from '../Button/Button';

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    // هدایت کاربر به شروع OAuth
    window.location.href = '/api/auth/google';
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      color='blue'
      className='mt-4 flex w-full items-center justify-center gap-2'
    >
      <GrGoogle />
      ورود با گوگل
    </Button>
  );
}
