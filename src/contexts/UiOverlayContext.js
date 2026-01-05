/* eslint-disable react/prop-types */
'use client';
import React, { createContext, useContext, useMemo, useState } from 'react';

const UiOverlayContext = createContext(null);

export function UiOverlayProvider({ children }) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const value = useMemo(() => ({ overlayOpen, setOverlayOpen }), [overlayOpen]);

  return (
    <UiOverlayContext.Provider value={value}>
      {children}
    </UiOverlayContext.Provider>
  );
}

export function useUiOverlay() {
  const ctx = useContext(UiOverlayContext);
  if (!ctx)
    throw new Error('useUiOverlay must be used within UiOverlayProvider');
  return ctx;
}
