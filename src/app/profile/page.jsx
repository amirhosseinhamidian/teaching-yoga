import ProfileHead from '@/components/templates/profile/ProfileHead';
import ProfileMainBox from '@/components/templates/profile/ProfileMainBox';
import React from 'react';

const page = async ({ searchParams }) => {
  const activeStatus = parseInt(searchParams?.active || '0', 10);
  return (
    <div className='container'>
      <ProfileHead />
      <ProfileMainBox status={activeStatus} />
    </div>
  );
};

export default page;
