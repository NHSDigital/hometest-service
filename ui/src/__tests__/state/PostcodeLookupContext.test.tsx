import "@testing-library/jest-dom";

import { PostcodeLookupProvider, usePostcodeLookup } from "@/state/PostcodeLookupContext";
import { SESSION_STORAGE_KEYS } from "@/lib/services/session-service";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("@/settings", () => ({ backendUrl: "http://mock-backend" }));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe("PostcodeLookupContext", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe("PostcodeLookupProvider", () => {
    it("provides initial empty state", () => {
      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      expect(result.current.postcode).toBe("");
      expect(result.current.addresses).toEqual([]);
      expect(result.current.selectedAddress).toBeNull();
      expect(result.current.lookupResultsStatus).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("rehydrates postcode lookup state from session storage", async () => {
      const persistedState = {
        postcode: "SW1A 1AA",
        addresses: [
          {
            id: "1",
            line1: "10 Downing Street",
            town: "London",
            postcode: "SW1A 2AA",
            fullAddress: "10 Downing Street, London, SW1A 2AA",
          },
        ],
        selectedAddress: {
          id: "1",
          line1: "10 Downing Street",
          town: "London",
          postcode: "SW1A 2AA",
          fullAddress: "10 Downing Street, London, SW1A 2AA",
        },
        lookupResultsStatus: "found",
        error: null,
      };

      window.sessionStorage.setItem(
        SESSION_STORAGE_KEYS.postcodeLookup,
        JSON.stringify(persistedState),
      );

      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      await waitFor(() => {
        expect(result.current.postcode).toBe("SW1A 1AA");
      });

      expect(result.current.addresses).toEqual(persistedState.addresses);
      expect(result.current.selectedAddress).toEqual(persistedState.selectedAddress);
      expect(result.current.lookupResultsStatus).toBe("found");
    });

    it("sets found status when lookup returns addresses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          addresses: [
            {
              id: "1",
              line1: "10 Downing Street",
              town: "London",
              postcode: "SW1A 2AA",
              fullAddress: "10 Downing Street, London, SW1A 2AA",
            },
          ],
        }),
      });

      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      await act(async () => {
        await result.current.lookupPostcode("SW1A 1AA");
      });

      expect(result.current.lookupResultsStatus).toBe("found");
      expect(result.current.addresses).toHaveLength(1);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.postcodeLookup)).not.toBeNull();
      });
    });

    it("sets not_found status when lookup returns no addresses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ addresses: [] }),
      });

      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      await act(async () => {
        await result.current.lookupPostcode("SW1A 1AA");
      });

      expect(result.current.lookupResultsStatus).toBe("not_found");
      expect(result.current.addresses).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("sets error status when lookup request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      await act(async () => {
        await result.current.lookupPostcode("SW1A 1AA");
      });

      expect(result.current.lookupResultsStatus).toBe("error");
      expect(result.current.addresses).toEqual([]);
      expect(result.current.error).toBe("Failed to lookup postcode");
    });

    it("clearAddresses clears state and persisted postcode data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          addresses: [
            {
              id: "1",
              line1: "10 Downing Street",
              town: "London",
              postcode: "SW1A 2AA",
              fullAddress: "10 Downing Street, London, SW1A 2AA",
            },
          ],
        }),
      });

      const { result } = renderHook(() => usePostcodeLookup(), {
        wrapper: PostcodeLookupProvider,
      });

      await act(async () => {
        await result.current.lookupPostcode("SW1A 1AA");
      });

      await waitFor(() => {
        expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.postcodeLookup)).not.toBeNull();
      });

      act(() => {
        result.current.clearAddresses();
      });

      expect(result.current.postcode).toBe("");
      expect(result.current.addresses).toEqual([]);
      expect(result.current.selectedAddress).toBeNull();
      expect(result.current.lookupResultsStatus).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.postcodeLookup)).toBeNull();
    });
  });

  describe("usePostcodeLookup", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() => usePostcodeLookup());
      }).toThrow("usePostcodeLookup must be used within a PostcodeLookupProvider");
    });
  });
});
