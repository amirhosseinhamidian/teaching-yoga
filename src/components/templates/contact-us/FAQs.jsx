import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@/components/Ui/Accordion/Accordion';

function FAQs({ data, className }) {
  return (
    <div
      className={`rounded-xl bg-surface-light p-4 font-medium xs:p-6 dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>سوالات متداول</h3>
      {data.map((faq) => (
        <Accordion
          key={faq.id}
          title={faq.question}
          content={faq.answer}
          className='mb-4'
        />
      ))}
    </div>
  );
}

FAQs.propTypes = {
  data: PropTypes.array.isRequired,
  className: PropTypes.string,
};

export default FAQs;
