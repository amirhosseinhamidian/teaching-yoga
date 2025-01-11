'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import AddEditTermModal from '../../modules/AddEditTermForCourseModal/AddEditTermForCourseModal';

const HeadAction = ({ courseId, courseTitle, addTermSuccessfully }) => {
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-base font-semibold xs:text-xl'>
          {`افزودن ترم و جلسات ${courseTitle}`}
        </h1>
        <Button
          onClick={() => setShowAddTermModal(true)}
          shadow
          className='flex items-center justify-center'
        >
          افزودن ترم
        </Button>
      </div>
      {showAddTermModal && (
        // add modal
        <AddEditTermModal
          courseId={courseId}
          onClose={() => setShowAddTermModal(false)}
          onSuccess={(newTerm) => {
            addTermSuccessfully(newTerm);
            setShowAddTermModal(false);
          }}
        />
      )}
    </>
  );
};

HeadAction.propTypes = {
  courseId: PropTypes.number.isRequired,
  courseTitle: PropTypes.string.isRequired,
  addTermSuccessfully: PropTypes.func.isRequired,
};

export default HeadAction;
