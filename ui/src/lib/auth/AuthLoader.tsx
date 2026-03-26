"use client";

import { useEffect } from "react";
import { Outlet, useLoaderData } from "react-router-dom";

import type { SessionData } from "@/lib/auth/requireAuth";
import { useAuth } from "@/state";

export function AuthLoader({ children }: Readonly<{ children?: React.ReactNode }>) {
  const loaderData = useLoaderData() as SessionData;
  const { setUser, user } = useAuth();

  useEffect(() => {
    if (user || !loaderData) {
      return;
    }

    setUser(loaderData.user);
  }, [loaderData, setUser, user]);

  if (loaderData && !user) {
    return null;
  }

  return <>{children ?? <Outlet />}</>;
}
