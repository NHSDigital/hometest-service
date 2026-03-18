import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";
import { TestErrorBoundary } from "@/lib/test-utils/TestErrorBoundary";
import { useThrowError } from "@/hooks/useThrowError";

function AsyncSubmitter({ error }: Readonly<{ error: Error }>) {
  const throwError = useThrowError();

  const handleSubmit = async (event: React.SubmitEvent) => {
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
