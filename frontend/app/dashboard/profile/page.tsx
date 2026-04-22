"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, type User } from "@/lib/auth";
import ProfileView from "../components/ProfileView";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    if (!currentUser) {
      router.replace("/auth/login");
    }
  }, [router]);

  if (!user) return null;

  return <ProfileView userId={user.id} isCurrentUser />;
}
