import React from "react";

export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { errorMessage: null };
  }

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
