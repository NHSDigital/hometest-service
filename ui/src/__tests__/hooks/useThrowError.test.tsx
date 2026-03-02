import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { useThrowError } from "@/hooks/useThrowError";

class TestErrorBoundary extends React.Component<
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

function AsyncSubmitter({ error }: Readonly<{ error: Error }>) {
  const throwError = useThrowError();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await Promise.resolve();
    throwError(error);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
    </form>
  );
}

describe("useThrowError", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("rethrows async submit-handler errors during render so an error boundary can handle them", async () => {
    const error = new Error("Unable to determine local authority or suppliers");

    render(
      <TestErrorBoundary>
        <AsyncSubmitter error={error} />
      </TestErrorBoundary>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(
        screen.getByText("Unable to determine local authority or suppliers"),
      ).toBeInTheDocument();
    });
  });
});
