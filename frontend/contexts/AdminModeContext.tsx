"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type AdminModeContextValue = {
  isAdmin: boolean;
  setAdmin: (value: boolean) => void;
};

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setAdminState] = useState(false);
  const setAdmin = useCallback((value: boolean) => setAdminState(value), []);
  return (
    <AdminModeContext.Provider value={{ isAdmin, setAdmin }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const ctx = useContext(AdminModeContext);
  if (!ctx) {
    return { isAdmin: false, setAdmin: () => {} };
  }
  return ctx;
}
