import React, { createContext, useContext } from 'react';

export type MainTabId =
  | 'dashboard'
  | 'food'
  | 'exercise'
  | 'progress'
  | 'cyclesync'
  | 'profile';

const MainTabContext = createContext<{
  setMainTab: (tab: MainTabId) => void;
} | null>(null);

export function MainTabProvider({
  children,
  setMainTab,
}: {
  children: React.ReactNode;
  setMainTab: (tab: MainTabId) => void;
}) {
  return (
    <MainTabContext.Provider value={{ setMainTab }}>{children}</MainTabContext.Provider>
  );
}

export function useMainTab() {
  return useContext(MainTabContext);
}
