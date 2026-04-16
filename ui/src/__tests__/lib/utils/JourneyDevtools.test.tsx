import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { JourneyDevtools } from "@/lib/utils/JourneyDevtools";
import { CreateOrderProvider, JourneyNavigationProvider, PostcodeLookupProvider } from "@/state";

function JourneyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/get-self-test-kit-for-HIV"]}>
      <JourneyNavigationProvider>
        <CreateOrderProvider>
          <PostcodeLookupProvider>{children}</PostcodeLookupProvider>
        </CreateOrderProvider>
      </JourneyNavigationProvider>
    </MemoryRouter>
  );
}

describe("JourneyDevtools", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete globalThis.__appDebug;
  });

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      configurable: true,
      writable: true,
    });
    delete globalThis.__appDebug;
  });

  it("renders nothing to the DOM", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
      writable: true,
    });

    const { container } = render(
      <JourneyWrapper>
        <JourneyDevtools />
      </JourneyWrapper>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("registers order, navigation and postcode debug state in development", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
      writable: true,
    });

    render(
      <JourneyWrapper>
        <JourneyDevtools />
      </JourneyWrapper>,
    );

    expect(globalThis.__appDebug).toBeDefined();
    expect(globalThis.__appDebug!.order).toBeDefined();
    expect(globalThis.__appDebug!.navigation).toBeDefined();
    expect(globalThis.__appDebug!.postcode).toBeDefined();
  });

  it("does not register debug state in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      configurable: true,
      writable: true,
    });

    render(
      <JourneyWrapper>
        <JourneyDevtools />
      </JourneyWrapper>,
    );

    expect(globalThis.__appDebug).toBeUndefined();
  });

  it("cleans up all debug slices on unmount", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      configurable: true,
      writable: true,
    });

    const { unmount } = render(
      <JourneyWrapper>
        <JourneyDevtools />
      </JourneyWrapper>,
    );

    expect(globalThis.__appDebug!.order).toBeDefined();
    expect(globalThis.__appDebug!.navigation).toBeDefined();
    expect(globalThis.__appDebug!.postcode).toBeDefined();

    unmount();

    expect(globalThis.__appDebug!.order).toBeUndefined();
    expect(globalThis.__appDebug!.navigation).toBeUndefined();
    expect(globalThis.__appDebug!.postcode).toBeUndefined();
  });
});
