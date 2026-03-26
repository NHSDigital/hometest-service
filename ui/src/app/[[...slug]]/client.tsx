// This ErrorBoundary is a global safety net for any unhandled client-side errors.
// It catches errors during hydration, dynamic import, or anywhere in the React tree,
// including before React Router's own error handling (ErrorRedirect) is mounted.
// This ensures users are redirected to a safe error page even if the app's own
// error handling fails to mount or an unexpected error occurs outside the router.
"use client";

import dynamic from "next/dynamic";
import React from "react";

import { RoutePath } from "@/lib/models/route-paths";

const App = dynamic(async () => import("../../app"), { ssr: false });

type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled application error:", error);
    globalThis.location.replace(RoutePath.ServiceErrorPage);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export function ClientOnly() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
