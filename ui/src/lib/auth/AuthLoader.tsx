"use client";

import { Outlet } from "react-router-dom";
import type { SessionData } from "./requireAuth";
import { useAuth } from "@/state/AuthContext";
import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";

export function AuthLoader({ children }: { children?: React.ReactNode }) {
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
