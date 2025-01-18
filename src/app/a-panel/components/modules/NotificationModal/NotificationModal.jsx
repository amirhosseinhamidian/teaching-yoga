import React from 'react';
import PropTypes from 'prop-types';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationModal = ({ onClose }) => {
  const { notifications } = useNotifications();
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div className='absolute left-7 top-14 w-60 rounded-xl bg-surface-light p-4 xs:left-14 xs:w-[300px] sm:w-96 md:w-[500px] dark:bg-background-dark'>
        <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
          نوتیفیکیشن‌ها
        </h2>
        {notifications.details.map((notification, index) => (
          <div key={index}>
            {notification.count !== 0 && (
              <NotificationItem
                count={notification.count}
                text={notification.text}
                path={notification.actionPath}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

NotificationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default NotificationModal;
