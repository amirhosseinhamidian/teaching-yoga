import React from 'react';
import SettingContent from '../components/templates/site-setting/SettingContent';
import FAQsSection from '../components/templates/site-setting/FAQsSection';

const SettingPage = () => {
  return (
    <div>
      <SettingContent />
      <hr className='my-10 border border-b border-gray-300 dark:border-gray-600'></hr>
      <FAQsSection />
    </div>
  );
};

export default SettingPage;
