/* eslint-disable react/react-in-jsx-scope */
import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import ErrorState from '@/components/templates/error-state/ErrorState';

export const metadata = {
  title: 'دسترسی غیرمجاز | سمانه یوگا',
  description: 'شما مجوز مشاهده این بخش را ندارید.',
  robots: {
    index: false,
    follow: false,
  },
};

const AccessDeniedPage = () => {
  return (
    <>
      <HeaderWrapper />

      <ErrorState
        code='403'
        variant='forbidden'
        eyebrow='دسترسی محدود'
        title='شما اجازه مشاهده این بخش را ندارید'
        description='این صفحه فقط برای کاربران دارای دسترسی معتبر قابل مشاهده است. ممکن است لازم باشد وارد حساب کاربری شوید، دوره را تهیه کنید یا از حسابی با سطح دسترسی مناسب استفاده کنید.'
        primaryHref='/login'
        primaryLabel='ورود به حساب'
        secondaryHref='/courses'
        secondaryLabel='مشاهده دوره‌ها'
      />

      <Footer />
    </>
  );
};

export default AccessDeniedPage;
