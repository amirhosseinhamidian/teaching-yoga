'use client';

import EpisodeForm from '@/app/a-panel/components/templates/podcast/EpisodeForm';
import React from 'react';
import { useParams } from 'next/navigation';

const EpisodeCreatePage = () => {
  const params = useParams();
  const podcastId = params?.podcastId;

  return (
    <div>
      <EpisodeForm podcastId={podcastId} />
    </div>
  );
};

export default EpisodeCreatePage;
