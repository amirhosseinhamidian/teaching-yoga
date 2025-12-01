/* eslint-disable no-undef */
'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// ----------------------------------------
//  Verify OTP
// ----------------------------------------
export const verifyOtp = createAsyncThunk(
  'user/verifyOtp',
  async ({ phone, code }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!data.success) return rejectWithValue(data.error || 'OTP invalid');
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ----------------------------------------
//  Signup User
// ----------------------------------------
export const signupUser = createAsyncThunk(
  'user/signup',
  async ({ username, phone }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone }),
      });

      const data = await res.json();
      if (!data.success) return rejectWithValue(data.error);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ----------------------------------------
//  Login User (OTP Login)
// ----------------------------------------
export const loginOtp = createAsyncThunk(
  'user/loginOtp',
  async ({ phone }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!data.success) return rejectWithValue(data.error);
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ----------------------------------------
//  Send OTP
// ----------------------------------------
export const sendOtp = createAsyncThunk(
  'user/sendOtp',
  async (phone, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!data.success) {
        return rejectWithValue(data.error || 'ارسال کد ناموفق بود.');
      }

      // expected: { success: true, token: "12345" }
      return {
        token: data.token,
      };
    } catch (err) {
      return rejectWithValue('خطا در ارتباط با سرور.');
    }
  }
);
// ----------------------------------------
//  Load full user profile from cookie session
// ----------------------------------------
export const loadUser = createAsyncThunk(
  'user/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/get-me`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json();
      if (!data.success) return null;
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ----------------------------------------
// Slice
// ----------------------------------------
const userSlice = createSlice({
  name: 'user',
  initialState: {
    loading: false,
    error: null,
    isAuthenticated: false,
    data: null,
  },

  reducers: {
    logoutUser(state) {
      state.data = null;
      state.isAuthenticated = false;
    },
    setUserFromServer(state, action) {
      if (action.payload) {
        state.data = action.payload;
        state.isAuthenticated = true;
      } else {
        state.data = null;
        state.isAuthenticated = false;
      }
    },
  },

  extraReducers: (builder) => {
    // ----------------------------------------
    // verifyOtp
    // ----------------------------------------
    builder.addCase(verifyOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(verifyOtp.fulfilled, (state) => {
      state.loading = false;
      // verifyOtp هیچ اطلاعات کاربری نمی دهد
      // فقط تایید می‌کند که کد صحیح بوده
    });

    builder.addCase(verifyOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'کد تایید نادرست است';
    });

    // ----------------------------------------
    // signupUser
    // ----------------------------------------
    builder.addCase(signupUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(signupUser.fulfilled, (state) => {
      state.loading = false;
      // signup فقط ثبت‌نام می‌کند
      // و login انجام نمی‌دهد → پس user داخل state قرار نمی‌گیرد
      // اطلاعات اضافی signup لازم نیست در store ذخیره شود
    });

    builder.addCase(signupUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'خطا در ثبت‌نام';
    });

    // ----------------------------------------
    // loginOtp
    // ----------------------------------------
    builder.addCase(loginOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(loginOtp.fulfilled, (state) => {
      state.loading = false;

      // loginOtp فقط کوکی auth_token را ست می‌کند
      // هنوز user را نمی‌دانیم → loadUser بعداً اجرا می‌شود
    });

    builder.addCase(loginOtp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'ورود ناموفق بود';
    });

    // ----------------------------------------
    // loadUser
    // ----------------------------------------
    builder.addCase(loadUser.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.loading = false;

      if (action.payload) {
        state.data = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      }
    });

    builder.addCase(loadUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.data = null;
      state.isAuthenticated = false;
    });

    // ----------------------------------------
    // SendOtp
    // ----------------------------------------
    builder.addCase(sendOtp.pending, (s) => {
      s.loading = true;
    });
    builder.addCase(sendOtp.fulfilled, (s) => {
      s.loading = false;
      // توکن را در state ذخیره نمی‌کنیم چون در zustand ذخیره می‌شود
    });
    builder.addCase(sendOtp.rejected, (s, action) => {
      s.loading = false;
      s.error = action.payload;
    });
  },
});

export const { logoutUser, setUserFromServer } = userSlice.actions;
export default userSlice.reducer;
