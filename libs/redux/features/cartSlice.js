/* eslint-disable no-undef */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* -----------------------------------
 * Helper — Normalize API Response
 * ----------------------------------- */
const normalizeCart = (data) => {
  const cart = data?.cart || {};

  return {
    cartId: cart.id || null,
    items: cart.courses || [],
    totalPrice: cart.totalPrice || 0,
    totalDiscount: cart.totalDiscount || 0,
    totalPriceWithoutDiscount: cart.totalPriceWithoutDiscount || 0,
    discountAmount: cart.discountAmount || 0,
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
      if (!res.ok) return rejectWithValue(data.message);

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

      console.log('add to cart is complete');

      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.message);

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
      if (!res.ok) return rejectWithValue(data.message);

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
      if (!res.ok) return rejectWithValue(data.message);

      return normalizeCart({ cart: { courses: [] } });
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
      if (!res.ok) return rejectWithValue(data.message);

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
    builder
      /* fetchCart */
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* addToCart */
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* removeFromCart */
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* clearServerCart */
      .addCase(clearServerCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearServerCart.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(clearServerCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* applyDiscount */
      .addCase(applyDiscount.pending, (state) => {
        state.loading = true;
      })
      .addCase(applyDiscount.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(applyDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
