'use client';
import EpisodeForm from '@/app/a-panel/components/templates/podcast/EpisodeForm';
import { useParams } from 'next/navigation';
import React from 'react';

const EpisodeEditPage = () => {
  const params = useParams();
  const id = params?.id;
  return (
    <div>
      <EpisodeForm id={id} />
    </div>
  );
};

export default EpisodeEditPage;
