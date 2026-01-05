import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/userSlice';
import cartReducer from './features/cartSlice';
import shopCartReducer from './features/shopCartSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    shopCart: shopCartReducer,
  },
});
