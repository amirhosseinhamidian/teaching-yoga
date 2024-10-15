import React from 'react'

export default function Logo() {
  return (
    <div className='flex items-end gap-2'>
        <img src="/images/logo.png" alt="samaneh yoga logo" className='max-h-12' />
        <h2 className='font-fancy text-2xl text-text-light dark:text-text-dark'>سمانه یوگا</h2>
    </div>
  )
}
