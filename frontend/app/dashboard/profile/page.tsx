"use client";

import { useEffect, useState } from "react";
import { getUser, type User } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account settings
        </p>
      </div>

      <div className="bg-bg-secondary border border-border rounded-xl p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-bg-tertiary border border-border flex items-center justify-center">
            <span className="text-lg font-semibold text-text-secondary">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{user.name}</p>
            <p className="text-xs text-text-tertiary">{user.email}</p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Info rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Role</span>
            <span className="text-sm text-text-primary capitalize">{user.role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm text-text-primary">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Member since</span>
            <span className="text-sm text-text-primary">February 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
