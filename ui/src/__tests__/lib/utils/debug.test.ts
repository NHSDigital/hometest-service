import { registerDebugState, unregisterDebugState } from "@/lib/utils/debug";

describe("debug utilities", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    delete globalThis.__appDebug;
  });

  afterEach(() => {
    Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv, configurable: true, writable: true });
    delete globalThis.__appDebug;
  });

  describe("registerDebugState", () => {
    it("registers a state getter accessible via __appDebug in development", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });
      const state = { count: 1 };

      registerDebugState("test", () => state);

      expect(globalThis.__appDebug).toBeDefined();
      expect(globalThis.__appDebug!.test).toEqual({ count: 1 });
    });

    it("returns live values via the getter", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });
      let state = { count: 1 };

      registerDebugState("test", () => state);
      expect(globalThis.__appDebug!.test).toEqual({ count: 1 });

      state = { count: 2 };
      expect(globalThis.__appDebug!.test).toEqual({ count: 2 });
    });

    it("does nothing in production", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });

      registerDebugState("test", () => "value");

      expect(globalThis.__appDebug).toBeUndefined();
    });

    it("allows registering multiple slices", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });

      registerDebugState("auth", () => ({ user: "alice" }));
      registerDebugState("order", () => ({ id: 1 }));

      expect(globalThis.__appDebug!.auth).toEqual({ user: "alice" });
      expect(globalThis.__appDebug!.order).toEqual({ id: 1 });
    });

    it("overwrites a previously registered slice", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });

      registerDebugState("test", () => "first");
      registerDebugState("test", () => "second");

      expect(globalThis.__appDebug!.test).toBe("second");
    });

    it("enumerates registered slices", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });

      registerDebugState("a", () => 1);
      registerDebugState("b", () => 2);

      expect(Object.keys(globalThis.__appDebug!)).toEqual(
        expect.arrayContaining(["a", "b"]),
      );
    });
  });

  describe("unregisterDebugState", () => {
    it("removes a registered slice", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });

      registerDebugState("test", () => "value");
      expect(globalThis.__appDebug!.test).toBe("value");

      unregisterDebugState("test");
      expect(globalThis.__appDebug!.test).toBeUndefined();
    });

    it("does nothing in production", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });

      unregisterDebugState("test");

      expect(globalThis.__appDebug).toBeUndefined();
    });

    it("does nothing if __appDebug does not exist", () => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "development", configurable: true, writable: true });

      expect(() => unregisterDebugState("test")).not.toThrow();
    });
  });
});
