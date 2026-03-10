"use client";

import { useEffect } from "react";
import { useAuth } from "@/state/AuthContext";
import { registerDebugState, unregisterDebugState } from "./debug";

function AppDevtoolsInner() {
  const { user } = useAuth();

  useEffect(() => {
    registerDebugState("auth", () => user);
    return () => unregisterDebugState("auth");
  }, [user]);

  return null;
}

export function AppDevtools() {
  if (process.env.NODE_ENV !== "development") return null;
  return <AppDevtoolsInner />;
}
