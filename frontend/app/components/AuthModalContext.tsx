"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type AuthTab = "login" | "signup";

interface AuthModalContextType {
  isOpen: boolean;
  tab: AuthTab;
  openAuthModal: (initialTab?: AuthTab) => void;
  closeAuthModal: () => void;
  setTab: (tab: AuthTab) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<AuthTab>("login");

  const openAuthModal = (initialTab: AuthTab = "login") => {
    setTab(initialTab);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        tab,
        openAuthModal,
        closeAuthModal,
        setTab,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
