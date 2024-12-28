import ProfileHead from '@/components/templates/profile/ProfileHead';
import ProfileMainBox from '@/components/templates/profile/ProfileMainBox';
import React from 'react';

const page = async () => {
  return (
    <div className='container'>
      <ProfileHead />
      <ProfileMainBox />
    </div>
  );
};

export default page;
