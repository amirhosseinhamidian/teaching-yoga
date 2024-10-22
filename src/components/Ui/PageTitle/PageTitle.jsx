/* eslint-disable react/prop-types */
import React from 'react'

const PageTitle = ({children}) => {
  return (
    <h1 className='my-4 text-xl font-semibold md:my-6 md:text-3xl'>
        {children}
    </h1>
  )
}

export default PageTitle