'use client';
/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children, initialUser }) => {
  const [userPhone, setUserPhone] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState(-1);
  const [user, setUser] = useState(initialUser);

  const resetToken = () => {
    setToken(-1);
  };

  useEffect(() => {
    if (token !== null) {
      const timer = setTimeout(() => {
        resetToken();
      }, 120000);
      return () => clearTimeout(timer);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        userPhone,
        setUserPhone,
        username,
        setUsername,
        token,
        setToken,
        user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
