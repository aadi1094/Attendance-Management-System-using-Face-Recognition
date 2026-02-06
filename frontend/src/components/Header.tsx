"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuthUser, clearAuth } from "@/lib/api";

export function Header() {
  const [user, setUser] = useState<ReturnType<typeof getAuthUser>>(null);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
        >
          Attendance System
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link
                href={
                  user.role === "student"
                    ? "/student/dashboard"
                    : user.role === "teacher"
                      ? "/teacher/dashboard"
                      : "/admin/dashboard"
                }
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Home
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
