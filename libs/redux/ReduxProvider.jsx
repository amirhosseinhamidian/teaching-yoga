/* eslint-disable react/prop-types */
'use client';

import { Provider } from 'react-redux';
import { store } from './store';

export default function ReduxProvider({ children }) {
  // eslint-disable-next-line react/react-in-jsx-scope
  return <Provider store={store}>{children}</Provider>;
}
