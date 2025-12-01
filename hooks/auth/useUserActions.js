'use client';

import {
  loadUser,
  logoutUser,
  verifyOtp,
  signupUser,
  loginOtp,
  sendOtp,
} from '@/libs/redux/features/userSlice';
import { useDispatch } from 'react-redux';

export function useUserActions() {
  const dispatch = useDispatch();

  return {
    loadUser: () => dispatch(loadUser()),
    logout: () => dispatch(logoutUser()),
    verifyOtp: (payload) => dispatch(verifyOtp(payload)),
    signupUser: (payload) => dispatch(signupUser(payload)),
    loginOtp: (payload) => dispatch(loginOtp(payload)),
    sendOtp: (phone) => dispatch(sendOtp(phone)),
  };
}
