// Test-only error boundary: catches errors thrown by children during render/lifecycle,
// and displays the error message. Used to assert error handling in tests.
import React from "react";

export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { errorMessage: null };
  }

  // React calls this static method if a child throws during render/lifecycle.
  static getDerivedStateFromError(error: unknown) {
    return {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }

  render() {
    if (this.state.errorMessage) {
      return <div>{this.state.errorMessage}</div>;
    }

    return this.props.children;
  }
}
