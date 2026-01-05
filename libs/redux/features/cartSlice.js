/* eslint-disable no-undef */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* -----------------------------------
 * Helper — Normalize API Response (ROBUST)
 * ----------------------------------- */
const normalizeCart = (data) => {
  // حالت‌های مختلف پاسخ:
  // 1) { cart: {...} }
  // 2) { courseCart: {...} }  (اگر بعداً خواستی جدا کنی)
  // 3) خود cart مستقیم برگشته باشد: { id, courses, ... }
  const cart = data?.cart || data?.courseCart || data || {};

  return {
    cartId: cart.id ?? null,

    // گاهی API ممکنه اسم رو items بذاره
    items: Array.isArray(cart.courses)
      ? cart.courses
      : Array.isArray(cart.items)
        ? cart.items
        : [],

    totalPrice: cart.totalPrice ?? 0,
    totalDiscount: cart.totalDiscount ?? 0,
    totalPriceWithoutDiscount: cart.totalPriceWithoutDiscount ?? 0,

    // بعضی جاها discountCodeAmount ذخیره میشه
    discountAmount: cart.discountAmount ?? cart.discountCodeAmount ?? 0,
  };
};

/* -----------------------------------
 * 1) fetchCart
 * ----------------------------------- */
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'خطا در دریافت سبد');

      return normalizeCart(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/* -----------------------------------
 * 2) addToCart
 * ----------------------------------- */
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.message || 'خطا در افزودن دوره');

      return normalizeCart(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------
 * 3) removeFromCart
 * ----------------------------------- */
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        }
      );

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'خطا در حذف دوره');

      return normalizeCart(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------
 * 4) clearServerCart
 * ----------------------------------- */
export const clearServerCart = createAsyncThunk(
  'cart/clearServerCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart/clear`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.message || 'خطا در پاکسازی سبد');

      return normalizeCart({
        cart: {
          id: null,
          courses: [],
          totalPrice: 0,
          totalDiscount: 0,
          totalPriceWithoutDiscount: 0,
          discountAmount: 0,
        },
      });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------
 * 5) applyDiscount
 * ----------------------------------- */
export const applyDiscount = createAsyncThunk(
  'cart/applyDiscount',
  async ({ code, cartId }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apply-discount-code`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, cartId }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.message || 'کد تخفیف معتبر نیست');

      // ✅ خیلی مهم: normalize روی پاسخ واقعی
      return normalizeCart(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------
 * Slice
 * ----------------------------------- */
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cartId: null,
    items: [],
    loading: false,
    error: null,
    totalPrice: 0,
    totalDiscount: 0,
    totalPriceWithoutDiscount: 0,
    discountAmount: 0,
  },

  reducers: {
    clearCartState: (state) => {
      state.cartId = null;
      state.items = [];
      state.loading = false;
      state.error = null;
      state.totalPrice = 0;
      state.totalDiscount = 0;
      state.totalPriceWithoutDiscount = 0;
      state.discountAmount = 0;
    },
  },

  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || 'خطا';
    };
    const fulfilled = (state, action) => {
      state.loading = false;
      Object.assign(state, action.payload);
    };

    builder
      .addCase(fetchCart.pending, pending)
      .addCase(fetchCart.fulfilled, fulfilled)
      .addCase(fetchCart.rejected, rejected)

      .addCase(addToCart.pending, pending)
      .addCase(addToCart.fulfilled, fulfilled)
      .addCase(addToCart.rejected, rejected)

      .addCase(removeFromCart.pending, pending)
      .addCase(removeFromCart.fulfilled, fulfilled)
      .addCase(removeFromCart.rejected, rejected)

      .addCase(clearServerCart.pending, pending)
      .addCase(clearServerCart.fulfilled, fulfilled)
      .addCase(clearServerCart.rejected, rejected)

      .addCase(applyDiscount.pending, pending)
      .addCase(applyDiscount.fulfilled, fulfilled)
      .addCase(applyDiscount.rejected, rejected);
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
