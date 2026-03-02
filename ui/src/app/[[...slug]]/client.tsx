"use client";

import React from "react";
import dynamic from "next/dynamic";
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
    window.location.replace(RoutePath.ServiceErrorPage);
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
