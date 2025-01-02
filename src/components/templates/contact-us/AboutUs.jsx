import Socials from '@/components/modules/Socials/Socials';
import React from 'react';
import PropTypes from 'prop-types';

const AboutUs = ({ className }) => {
  return (
    <div
      className={`rounded-xl bg-surface-light p-4 font-medium xs:p-6 dark:bg-surface-dark ${className}`}
    >
      <h1 className='text-xl xs:text-2xl md:text-3xl'>با من در ارتباط باش</h1>
      <p className='mt-2 text-xs font-thin text-subtext-light sm:mt-4 sm:text-sm md:mt-6 dark:text-subtext-dark'>
        کارمزد عبارت است از مزدی که بابت انجام مقدار کاری مشخص که از نظر کمی
        قابل اندازه‌گیری یا شمارش باشد به ازای هر واحدکار تعیین و پرداخت می‌شود.
        کارمزد برحسب آنکه حاصل کار موردنظر مربوط به یک نفر یا یک گروه مشخصی از
        کارگران یا مجموعه کارگران کارگاه باشد به‌ترتیب به‌صورت کارمزد انفرادی،
        کارمزد گروهی و کارمزد جمعی تعیین می‌شود. در نظام کارمزد گروهی و جمعی
        باید علاوه بر شغل هر یک از کارگران، سهم هر یک در میزان فعالیت و کارمزد
        متعلقه از قبل مشخص شود و موضوع مورد قبول کارگران باشد.
      </p>

      <h3 className='mt-4 text-sm font-medium sm:mt-6 sm:text-base'>
        شبکه های اجماعی را دنبال کنید:
      </h3>
      <Socials size={34} />
    </div>
  );
};

AboutUs.propTypes = {
  className: PropTypes.string,
};

export default AboutUs;
