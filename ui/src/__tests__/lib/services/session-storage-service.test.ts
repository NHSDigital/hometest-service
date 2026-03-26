import sessionStorageService from "@/lib/services/session-storage-service";

describe("SessionStorageService", () => {
  beforeEach(() => {
    globalThis.sessionStorage.clear();
  });

  describe("rehydrate", () => {
    it("returns fallback when sessionStorage is unavailable", () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
      Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });
      try {
        expect(sessionStorageService.rehydrate("key", "fallback")).toBe("fallback");
      } finally {
        Object.defineProperty(globalThis, "sessionStorage", original!);
      }
    });

    it("returns fallback when key does not exist", () => {
      expect(sessionStorageService.rehydrate("missing-key", 42)).toBe(42);
    });

    it("returns parsed value when key exists with valid JSON", () => {
      globalThis.sessionStorage.setItem("my-key", JSON.stringify({ foo: "bar" }));

      expect(sessionStorageService.rehydrate("my-key", null)).toEqual({ foo: "bar" });
    });

    it("returns fallback and removes key when stored value is invalid JSON", () => {
      globalThis.sessionStorage.setItem("bad-key", "not-valid-json{");

      expect(sessionStorageService.rehydrate("bad-key", "default")).toBe("default");
      expect(globalThis.sessionStorage.getItem("bad-key")).toBeNull();
    });
  });

  describe("dehydrate", () => {
    it("does nothing when sessionStorage is unavailable", () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
      Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });
      try {
        expect(() => sessionStorageService.dehydrate("key", { x: 1 })).not.toThrow();
      } finally {
        Object.defineProperty(globalThis, "sessionStorage", original!);
      }
    });

    it("stores value as JSON string", () => {
      sessionStorageService.dehydrate("my-key", { a: 1, b: true });

      expect(globalThis.sessionStorage.getItem("my-key")).toBe(JSON.stringify({ a: 1, b: true }));
    });
  });

  describe("remove", () => {
    it("does nothing when sessionStorage is unavailable", () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
      Object.defineProperty(globalThis, "sessionStorage", { value: undefined, configurable: true });
      try {
        expect(() => sessionStorageService.remove("key")).not.toThrow();
      } finally {
        Object.defineProperty(globalThis, "sessionStorage", original!);
      }
    });

    it("removes the key from sessionStorage", () => {
      globalThis.sessionStorage.setItem("to-remove", "value");

      sessionStorageService.remove("to-remove");

      expect(globalThis.sessionStorage.getItem("to-remove")).toBeNull();
    });
  });
});
