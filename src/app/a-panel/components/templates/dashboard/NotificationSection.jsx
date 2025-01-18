'use client';
import React from 'react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationContext';

const NotificationSection = () => {
  const { notifications } = useNotifications();
  return (
    <div>
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
  );
};

export default NotificationSection;
