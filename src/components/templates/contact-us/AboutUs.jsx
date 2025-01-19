import Socials from '@/components/modules/Socials/Socials';
import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import { MdOutlineMail } from 'react-icons/md';
import { LiaPhoneSolid } from 'react-icons/lia';

const AboutUs = ({ data, className }) => {
  return (
    <div
      className={`rounded-xl bg-surface-light p-4 font-medium xs:p-6 dark:bg-surface-dark ${className}`}
    >
      <h1 className='text-xl xs:text-2xl md:text-3xl'>با من در ارتباط باش</h1>
      <div className='mt-2 text-xs font-thin text-subtext-light sm:mt-4 sm:text-sm md:mt-6 dark:text-subtext-dark'>
        {data.fullDescription}
      </div>

      {data?.companyEmail && (
        <>
          <h3 className='mt-4 text-sm font-medium sm:mt-6 sm:text-base'>
            ایمیل:
          </h3>

          <div className='flex items-center gap-5'>
            <h3 className='text-base font-semibold sm:text-xl'>
              {data.companyEmail}
            </h3>
            <a href={`mailto:${data.companyEmail}`} aria-label='ارسال ایمیل'>
              <IconButton icon={MdOutlineMail} size={34} />
            </a>
          </div>
        </>
      )}

      {data?.companyPhone && (
        <>
          <h3 className='mt-4 text-sm font-medium sm:mt-6 sm:text-base'>
            تلفن:
          </h3>

          <div className='flex items-center gap-5'>
            <h3 className='font-faNa text-base font-semibold sm:text-xl'>
              {data.companyPhone}
            </h3>
            <a href={`tel:${data.companyPhone}`} aria-label='تماس'>
              <IconButton icon={LiaPhoneSolid} size={34} />
            </a>
          </div>
        </>
      )}

      <h3 className='mt-4 text-sm font-medium sm:mt-6 sm:text-base'>
        شبکه های اجماعی را دنبال کنید:
      </h3>
      <Socials size={34} socialLinks={data.socialLinks} />

      {data?.companyAddress && (
        <>
          <h3 className='mt-4 text-sm font-medium sm:mt-6 sm:text-base'>
            آدرس:
          </h3>
          <p className='font-faNa text-sm sm:text-base'>
            {data.companyAddress}
          </p>
        </>
      )}
    </div>
  );
};

AboutUs.propTypes = {
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
};

export default AboutUs;
