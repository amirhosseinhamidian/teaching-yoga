'use client';
/* eslint-disable react/prop-types */
import React, { createContext, useState, useEffect, useContext } from 'react';

// ایجاد Context
const NotificationContext = createContext();

// هوک استفاده از Context
export const useNotifications = () => {
  return useContext(NotificationContext);
};

// Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    total: 0,
    details: [],
  });

  // تابع برای فراخوانی API و به‌روزرسانی اطلاعات
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications'); // مسیر API
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // فراخوانی API در اولین بار
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
