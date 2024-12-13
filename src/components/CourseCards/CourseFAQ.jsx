import React from 'react';
import Accordion from '../Ui/Accordion/Accordion';
import PropTypes from 'prop-types';

const CourseFAQ = async ({ className }) => {
  const res = await fetch('http://localhost:3000/api/faqs');
  if (!res.ok) console.log('error faqs => ', res);
  const faqs = await res.json();

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl bg-surface-light p-6 pb-4 shadow dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>سوالات متداول</h3>
      {faqs.map((faq) => (
        <Accordion key={faq.id} title={faq.question} content={faq.answer} />
      ))}
    </div>
  );
};

CourseFAQ.propTypes = {
  className: PropTypes.string,
};

export default CourseFAQ;
