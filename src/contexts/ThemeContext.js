'use client';
/* eslint-disable react/prop-types */
import {
  getFromLocalStorage,
  setToLocalStorage,
} from '@/utils/localStorageHelper';
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const storedTheme = getFromLocalStorage('isDark');
  const [isDark, setIsDark] = useState(
    storedTheme !== null ? storedTheme : false,
  );

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    setToLocalStorage('isDark', newTheme);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
