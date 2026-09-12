"use client";

import React, { useEffect } from "react";
import { useAuthModal, type AuthTab } from "@/app/components/AuthModalContext";
import LandingPage from "@/app/page";

export default function AutoOpenAuthModal({
  initialTab,
}: {
  initialTab: AuthTab;
}) {
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    openAuthModal(initialTab);
  }, [initialTab, openAuthModal]);

  return <LandingPage />;
}
