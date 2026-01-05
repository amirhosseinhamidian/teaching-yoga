/* eslint-disable no-undef */
'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const normalizeShopCart = (data) => {
  const cart = data?.cart || {};
  return {
    cartId: cart.id ?? null,
    items: Array.isArray(cart.items) ? cart.items : [],
    subtotal: Number(cart.subtotal || 0),
    totalQty: Number(cart.totalQty || 0),

    // اگر بعداً از API اینا رو اضافه کردی:
    discountAmount: Number(cart.discountAmount || 0),
    payable:
      cart.payable != null
        ? Number(cart.payable || 0)
        : Math.max(
            0,
            Number(cart.subtotal || 0) - Number(cart.discountAmount || 0)
          ),
  };
};

/* ---------------------------
 * 1) fetchShopCart
 * -------------------------- */
export const fetchShopCart = createAsyncThunk(
  'shopCart/fetchShopCart',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/cart`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'خطا در دریافت سبد');

      return normalizeShopCart(data);
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

/* ---------------------------
 * 2) addShopItem
 * -------------------------- */
export const addShopItem = createAsyncThunk(
  'shopCart/addShopItem',
  async (
    { productId, colorId = null, sizeId = null, qty = 1 },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/cart/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, colorId, sizeId, qty }),
      });

      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.message || 'خطا در افزودن محصول');

      // ✅ حتماً کارت کامل را بگیر تا compareAt و بقیه فیلدها درست باشند
      const refreshed = await dispatch(fetchShopCart());
      if (refreshed.meta.requestStatus !== 'fulfilled') {
        return rejectWithValue(refreshed.payload || 'خطا در بروزرسانی سبد');
      }

      return refreshed.payload;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

/* ---------------------------
 * 3) updateShopItemQty
 * -------------------------- */
export const updateShopItemQty = createAsyncThunk(
  'shopCart/updateShopItemQty',
  async ({ itemId, qty }, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/cart/items/${itemId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      });

      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.message || 'خطا در بروزرسانی تعداد');

      const refreshed = await dispatch(fetchShopCart());
      if (refreshed.meta.requestStatus !== 'fulfilled') {
        return rejectWithValue(refreshed.payload || 'خطا در بروزرسانی سبد');
      }

      return refreshed.payload;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

/* ---------------------------
 * 4) removeShopItem
 * -------------------------- */
export const removeShopItem = createAsyncThunk(
  'shopCart/removeShopItem',
  async ({ itemId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/shop/cart/items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data?.message || 'خطا در حذف آیتم');

      const refreshed = await dispatch(fetchShopCart());
      if (refreshed.meta.requestStatus !== 'fulfilled') {
        return rejectWithValue(refreshed.payload || 'خطا در بروزرسانی سبد');
      }

      return refreshed.payload;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

const shopCartSlice = createSlice({
  name: 'shopCart',
  initialState: {
    cartId: null,
    items: [],
    subtotal: 0,
    totalQty: 0,

    // اگر از تخفیف کد استفاده می‌کنی:
    discountAmount: 0,
    payable: 0,

    loading: false,
    error: null,
  },
  reducers: {
    clearShopCartState: (state) => {
      state.cartId = null;
      state.items = [];
      state.subtotal = 0;
      state.totalQty = 0;
      state.discountAmount = 0;
      state.payable = 0;
      state.loading = false;
      state.error = null;
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

    builder
      .addCase(fetchShopCart.pending, pending)
      .addCase(fetchShopCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchShopCart.rejected, rejected)

      .addCase(addShopItem.pending, pending)
      .addCase(addShopItem.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(addShopItem.rejected, rejected)

      .addCase(updateShopItemQty.pending, pending)
      .addCase(updateShopItemQty.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(updateShopItemQty.rejected, rejected)

      .addCase(removeShopItem.pending, pending)
      .addCase(removeShopItem.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(removeShopItem.rejected, rejected);
  },
});

export const { clearShopCartState } = shopCartSlice.actions;
export default shopCartSlice.reducer;
