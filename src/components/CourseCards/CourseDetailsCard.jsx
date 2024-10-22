/* eslint-disable react/prop-types */

import React from 'react'

const CourseDetailsCard = ({icon:Icon, title, value}) => {
  return (
    <div className='rounded-xl bg-surface-light dark:bg-surface-dark shadow flex flex-col items-center gap-2 p-3 sm:p-4'>
        <Icon className="text-lg xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl sm:mb-2 text-accent"/>
        <span className='text-subtext-light dark:text-subtext-dark font-medium text-2xs xs:text-xs sm:text-sm md:text-base'>{title}</span>
        <span className='font-bold font-faNa text-xs xs:text-base sm:text-lg md:text-xl'>{value}</span>
    </div>
  )
}

export default CourseDetailsCard