import "@testing-library/jest-dom";

import { CreateOrderProvider, useCreateOrderContext } from "@/state/OrderContext";
import { SESSION_STORAGE_KEYS } from "@/lib/services/session-service";
import { act, renderHook } from "@testing-library/react";

describe("OrderContext", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  describe("CreateOrderProvider", () => {
    it("provides initial empty order answers", () => {
      const { result } = renderHook(() => useCreateOrderContext(), {
        wrapper: CreateOrderProvider,
      });

      expect(result.current.orderAnswers).toEqual({});
    });

    it("rehydrates order answers from session storage", () => {
      const persistedAnswers = {
        postcodeSearch: "SW1A 1AA",
        mobileNumber: "07700900123",
      };

      window.sessionStorage.setItem(
        SESSION_STORAGE_KEYS.createOrderAnswers,
        JSON.stringify(persistedAnswers),
      );

      const { result } = renderHook(() => useCreateOrderContext(), {
        wrapper: CreateOrderProvider,
      });

      expect(result.current.orderAnswers).toEqual(persistedAnswers);
    });

    it("updates order answers and persists them", () => {
      const { result } = renderHook(() => useCreateOrderContext(), {
        wrapper: CreateOrderProvider,
      });

      act(() => {
        result.current.updateOrderAnswers({
          postcodeSearch: "SW1A 1AA",
          mobileNumber: "07700900123",
        });
      });

      expect(result.current.orderAnswers).toEqual({
        postcodeSearch: "SW1A 1AA",
        mobileNumber: "07700900123",
      });
      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.createOrderAnswers)).toBe(
        JSON.stringify({
          postcodeSearch: "SW1A 1AA",
          mobileNumber: "07700900123",
        }),
      );
    });

    it("resets order answers and clears persisted state", () => {
      const { result } = renderHook(() => useCreateOrderContext(), {
        wrapper: CreateOrderProvider,
      });

      act(() => {
        result.current.updateOrderAnswers({ postcodeSearch: "SW1A 1AA" });
      });

      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.createOrderAnswers)).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.orderAnswers).toEqual({});
      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.createOrderAnswers)).toBeNull();
    });
  });

  describe("useCreateOrderContext", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() => useCreateOrderContext());
      }).toThrow("useCreateOrderContext must be used within a CreateOrderProvider");
    });
  });
});
