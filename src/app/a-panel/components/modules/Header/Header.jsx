'use client';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import React, { useState } from 'react';
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md';
import { GoBell } from 'react-icons/go';
import { useTheme } from '@/contexts/ThemeContext';
import { BiLogOut } from 'react-icons/bi';
import MobileSidebar from '../Sidebar/MobileSidebar';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationModal from '../NotificationModal/NotificationModal';
import Modal from '@/components/modules/Modal/Modal';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';

function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { notifications } = useNotifications();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { setUser } = useAuth();

  const signOutHandler = async () => {
    try {
      await signOut({ callbackUrl: '/' });
      setUser(null);
      setShowSignOutModal(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className='bg-surface-light dark:bg-surface-dark'>
      <div className='flex h-16 w-full items-center justify-between gap-2 px-4 sm:px-6'>
        <MobileSidebar />
        <div className='flex items-center gap-2'>
          <IconButton
            icon={isDark ? MdOutlineLightMode : MdOutlineDarkMode}
            onClick={toggleTheme}
          />
          <div
            className='relative'
            onClick={() =>
              notifications.total > 0 && setShowNotificationModal(true)
            }
          >
            <IconButton icon={GoBell} />
            <div
              className={`absolute -right-1 -top-2 h-5 w-5 items-center justify-center rounded-full bg-red pt-1 ${notifications.total === 0 ? 'hidden' : 'flex'}`}
            >
              <span className='font-faNa text-xs text-white sm:text-sm'>
                {notifications.total}
              </span>
            </div>
          </div>
          <IconButton
            icon={BiLogOut}
            onClick={() => setShowSignOutModal(true)}
          />
        </div>
      </div>
      {showNotificationModal && (
        <NotificationModal onClose={() => setShowNotificationModal(false)} />
      )}
      {showSignOutModal && (
        <Modal
          title='از حساب کاربری خارج می شوید؟'
          desc='با خروج از حساب کاربری از پنل ادمین خاج می شوید و به صفحه اول سایت می روید . درصورتی که بخواهید به پنل ادمین دسترسی داشته باشید باید مجدد وارد حساب کاربری خود شوید.'
          icon={BiLogOut}
          iconSize={36}
          primaryButtonClick={signOutHandler}
          secondaryButtonClick={() => setShowSignOutModal(false)}
          primaryButtonText='خروج از حساب'
          secondaryButtonText='لغو'
        />
      )}
    </header>
  );
}

export default Header;
