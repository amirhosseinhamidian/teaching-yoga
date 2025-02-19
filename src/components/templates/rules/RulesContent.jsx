'use client';
import React from 'react';
import PropTypes from 'prop-types';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';

const RulesContent = ({ rules }) => {
  return (
    <div className='container my-10'>
      <PageTitle>قوانین و مقررات سمانه یوگا</PageTitle>
      <div dangerouslySetInnerHTML={{ __html: rules }} />
    </div>
  );
};

RulesContent.propTypes = {
  rules: PropTypes.string.isRequired,
};

export default RulesContent;
