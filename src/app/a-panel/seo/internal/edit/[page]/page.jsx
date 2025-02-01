/* eslint-disable react/prop-types */
import React from 'react';
import SeoInternalForm from '@/app/a-panel/components/templates/seo/internal/form/SeoInternalForm';

const EditInternalSeoPage = ({ params }) => {
  const { page } = params;
  return (
    <>
      <SeoInternalForm page={page} />
    </>
  );
};

export default EditInternalSeoPage;
