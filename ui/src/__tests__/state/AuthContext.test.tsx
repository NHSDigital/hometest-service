import "@testing-library/jest-dom";

import { AuthProvider, AuthUser, useAuth } from "@/state/AuthContext";
import { act, render, renderHook, screen } from "@testing-library/react";

describe("AuthContext", () => {
  const mockUser: AuthUser = {
    sub: "test-user-123",
    nhsNumber: "9876543210",
    birthdate: "1985-05-15",
    identityProofingLevel: "P9",
    phoneNumber: "07700900123",
  };

  describe("AuthProvider", () => {
    it("renders children correctly", () => {
      render(
        <AuthProvider>
          <div data-testid="test-child">Test Content</div>
        </AuthProvider>,
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("provides initial state with no user", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.user).toBeNull();
    });

    it("provides setUser function", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.setUser).toBeDefined();
      expect(typeof result.current.setUser).toBe("function");
    });
  });

  describe("useAuth hook", () => {
    it("throws error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });

    it("returns context when used within AuthProvider", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeDefined();
      expect(result.current.setUser).toBeDefined();
    });
  });

  describe("Authentication state management", () => {
    it("updates user state when setUser is called", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.user).toBeNull();

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user?.nhsNumber).toBe("9876543210");
      expect(result.current.user?.birthdate).toBe("1985-05-15");
    });

    it("clears user state when setUser is called with null", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // First set a user
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);

      // Then clear the user
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
    });

    it("updates user correctly when setUser is called multiple times", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const firstUser: AuthUser = {
        sub: "user-1",
        nhsNumber: "1111111111",
        birthdate: "1990-01-01",
        identityProofingLevel: "P9",
        phoneNumber: "07700900111",
      };

      const secondUser: AuthUser = {
        sub: "user-2",
        nhsNumber: "2222222222",
        birthdate: "1995-12-31",
        identityProofingLevel: "P9",
        phoneNumber: "07700900222",
      };

      act(() => {
        result.current.setUser(firstUser);
      });

      expect(result.current.user).toEqual(firstUser);
      expect(result.current.user?.nhsNumber).toBe("1111111111");

      act(() => {
        result.current.setUser(secondUser);
      });

      expect(result.current.user).toEqual(secondUser);
      expect(result.current.user?.nhsNumber).toBe("2222222222");
    });
  });

  describe("User properties", () => {
    it("correctly stores all user properties", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const fullUser: AuthUser = {
        sub: "complete-user-id",
        nhsNumber: "9876543210",
        birthdate: "1985-05-15",
        identityProofingLevel: "P9",
        phoneNumber: "07700900123",
      };

      act(() => {
        result.current.setUser(fullUser);
      });

      expect(result.current.user?.sub).toBe("complete-user-id");
      expect(result.current.user?.nhsNumber).toBe("9876543210");
      expect(result.current.user?.birthdate).toBe("1985-05-15");
      expect(result.current.user?.identityProofingLevel).toBe("P9");
      expect(result.current.user?.phoneNumber).toBe("07700900123");
    });
  });

  describe("Callback stability", () => {
    it("setUser function reference remains stable", () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const initialSetUser = result.current.setUser;

      act(() => {
        result.current.setUser(mockUser);
      });

      rerender();

      expect(result.current.setUser).toBe(initialSetUser);
    });
  });
});
