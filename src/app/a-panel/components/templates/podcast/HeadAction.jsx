'use client';
import React from 'react';
import Button from '@/components/Ui/Button/Button';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Link from 'next/link';
import PropTypes from 'prop-types';

const HeadAction = ({ podcastId }) => {
  return (
    <div className='flex items-center justify-between'>
      <PageTitle>مدیریت پادکست</PageTitle>
      <Link href={`/a-panel/podcast/episode/create/${podcastId}`}>
        <Button shadow className='text-xs sm:text-sm xl:text-base'>
          افزودن اپیزود
        </Button>
      </Link>
    </div>
  );
};

HeadAction.propTypes = {
  podcastId: PropTypes.string.isRequired,
};

export default HeadAction;
