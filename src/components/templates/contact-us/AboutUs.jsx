import React from 'react';
import PropTypes from 'prop-types';

import Socials from '@/components/modules/Socials/Socials';

import {
  HiOutlineArrowUpLeft,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const ContactCard = ({ icon: Icon, label, value, href, dir }) => {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-white'>
        <Icon size={24} />
      </span>

      <span className='min-w-0 flex-1'>
        <span className='block text-[11px] text-subtext-light dark:text-subtext-dark'>
          {label}
        </span>

        <span
          dir={dir}
          className='mt-1 block break-words font-faNa text-sm font-bold leading-7 text-text-light transition-colors duration-300 group-hover:text-secondary dark:text-text-dark'
        >
          {value}
        </span>
      </span>

      {href && (
        <HiOutlineArrowUpLeft
          size={18}
          className='shrink-0 text-subtext-light opacity-40 transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-secondary group-hover:opacity-100 dark:text-subtext-dark'
        />
      )}
    </>
  );

  const className =
    'group flex w-full items-center gap-3 rounded-[22px] border border-black/5 bg-background-light/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_18px_45px_rgba(38,145,125,0.09)] dark:border-white/10 dark:bg-background-dark/45';

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a href={href} className={className} aria-label={`${label}: ${value}`}>
      {content}
    </a>
  );
};

ContactCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  href: PropTypes.string,
  dir: PropTypes.oneOf(['ltr', 'rtl', 'auto']),
};

const AboutUs = ({ data = null, className = '' }) => {
  const socialLinks = Array.isArray(data?.socialLinks) ? data.socialLinks : [];

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border border-black/5 bg-surface-light/70 p-5 shadow-[0_24px_75px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-7 lg:p-8 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_28px_85px_rgba(0,0,0,0.26)] ${className}`}
    >
      <div
        aria-hidden='true'
        className='absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-secondary/55 to-transparent'
      />

      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 absolute -bottom-28 -left-28 h-64 w-64 rounded-full blur-[95px]'
      />

      <div className='relative z-10'>
        <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary'>
          <HiOutlineSparkles size={17} />

          <span>راه‌های ارتباطی</span>
        </div>

        <h2 className='text-2xl font-black leading-10 text-text-light sm:text-3xl dark:text-text-dark'>
          با سمانه یوگا در ارتباط باش
        </h2>

        {data?.fullDescription && (
          <div
            className='mt-4 text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 dark:text-subtext-dark [&_a]:font-bold [&_a]:text-secondary [&_li]:mb-2 [&_ol]:mr-5 [&_ol]:list-decimal [&_p]:mb-3 [&_strong]:font-black [&_strong]:text-text-light dark:[&_strong]:text-text-dark [&_ul]:mr-5 [&_ul]:list-disc'
            dangerouslySetInnerHTML={{
              __html: data.fullDescription,
            }}
          />
        )}

        <div className='mt-7 space-y-3'>
          <ContactCard
            icon={HiOutlineEnvelope}
            label='ایمیل'
            value={data?.companyEmail}
            href={
              data?.companyEmail ? `mailto:${data.companyEmail}` : undefined
            }
            dir='ltr'
          />

          <ContactCard
            icon={HiOutlinePhone}
            label='شماره تماس'
            value={data?.companyPhone}
            href={data?.companyPhone ? `tel:${data.companyPhone}` : undefined}
            dir='ltr'
          />

          <ContactCard
            icon={HiOutlineMapPin}
            label='نشانی'
            value={data?.companyAddress}
          />
        </div>

        {socialLinks.length > 0 && (
          <div className='mt-7 rounded-[24px] border border-secondary/15 bg-secondary/5 p-5 dark:bg-secondary/10'>
            <div className='mb-4'>
              <h3 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                ما را در شبکه‌های اجتماعی دنبال کن
              </h3>

              <p className='mt-1 text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
                آموزش‌ها، خبرهای دوره‌ها و محتوای تازه را از شبکه‌های اجتماعی
                دنبال کن.
              </p>
            </div>

            <Socials size={32} socialLinks={socialLinks} />
          </div>
        )}

        {!data && (
          <div className='mt-6 rounded-2xl border border-black/5 bg-background-light/50 px-4 py-5 text-center text-sm leading-7 text-subtext-light dark:border-white/10 dark:bg-background-dark/40 dark:text-subtext-dark'>
            اطلاعات تماس در حال حاضر در دسترس نیست.
          </div>
        )}
      </div>
    </section>
  );
};

AboutUs.propTypes = {
  className: PropTypes.string,
  data: PropTypes.shape({
    fullDescription: PropTypes.string,
    companyEmail: PropTypes.string,
    companyPhone: PropTypes.string,
    companyAddress: PropTypes.string,
    socialLinks: PropTypes.array,
  }),
};

export default AboutUs;
