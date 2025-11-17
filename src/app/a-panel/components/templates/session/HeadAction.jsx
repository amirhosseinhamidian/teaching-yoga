'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Button from '@/components/Ui/Button/Button'
import SimpleAddSessionModal from '../../modules/SimpleAddSessionModal/SimpleAddSessionModal'

const HeadAction = ({ addSessionSuccessfully, className }) => {
  const [showAddSessionModal, setShowAddSessionModal] = useState(false)
  const handleAddSessionSuccessfully = (newSession) => {
    addSessionSuccessfully(newSession)
    setShowAddSessionModal(false)
  }
  return (
    <>
      <div
        className={`flex flex-wrap items-center justify-between gap-2${className}`}
      >
        <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
          مدیریت جلسه ها
        </h1>
        <Button
          onClick={() => setShowAddSessionModal(true)}
          shadow
          className='flex items-center justify-center text-xs sm:text-sm md:text-base'
        >
          افزودن جلسه
        </Button>
      </div>
      {showAddSessionModal && (
        <SimpleAddSessionModal
          onClose={() => setShowAddSessionModal(false)}
          onSuccess={(newSession) => handleAddSessionSuccessfully(newSession)}
        />
      )}
    </>
  )
}

HeadAction.propTypes = {
  courseId: PropTypes.number.isRequired,
  className: PropTypes.string,
  addSessionSuccessfully: PropTypes.func.isRequired,
}

export default HeadAction
