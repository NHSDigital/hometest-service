import "@testing-library/jest-dom";

import { render } from "@testing-library/react";
import { AppDevtools } from "@/lib/utils/AppDevtools";
import { AuthProvider } from "@/state/AuthContext";

describe("AppDevtools", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete globalThis.__appDebug;
  });

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv });
    delete globalThis.__appDebug;
  });

  it("renders nothing to the DOM", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "development" });

    const { container } = render(
      <AuthProvider>
        <AppDevtools />
      </AuthProvider>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("registers auth debug state in development", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "development" });

    render(
      <AuthProvider>
        <AppDevtools />
      </AuthProvider>,
    );

    expect(globalThis.__appDebug).toBeDefined();
    expect(globalThis.__appDebug!.auth).toBeNull();
  });

  it("does not register debug state in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production" });

    render(
      <AuthProvider>
        <AppDevtools />
      </AuthProvider>,
    );

    expect(globalThis.__appDebug).toBeUndefined();
  });

  it("cleans up debug state on unmount", () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "development" });

    const { unmount } = render(
      <AuthProvider>
        <AppDevtools />
      </AuthProvider>,
    );

    expect(globalThis.__appDebug!.auth).toBeNull();

    unmount();

    expect(globalThis.__appDebug!.auth).toBeUndefined();
  });
});
