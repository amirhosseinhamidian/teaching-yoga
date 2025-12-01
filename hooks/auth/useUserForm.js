'use client';

import { create } from 'zustand';

export const useUserForm = create((set) => ({
  // ---- states ----
  phone: '',
  username: '',
  otpToken: null,

  // ---- setters ----
  setPhone: (phone) => set({ phone }),
  setUsername: (username) => set({ username }),
  setOtpToken: (otpToken) => set({ otpToken }),

  // ---- clear all after login ----
  clearForm: () =>
    set({
      phone: '',
      username: '',
      otpToken: null,
    }),
}));
