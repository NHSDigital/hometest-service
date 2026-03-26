"use client";

import { ReactNode, createContext, useCallback, useContext, useState } from "react";

import sessionService from "@/lib/services/session-service";

export interface AuthUser {
  sub: string;
  nhsNumber: string;
  birthdate: string;
  identityProofingLevel: string;
  phoneNumber: string;
  givenName: string;
  familyName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() =>
    sessionService.rehydrateAuthUser<AuthUser>(),
  );

  const setUser = useCallback((user: AuthUser | null) => {
    setAuthUser(user);
    sessionService.dehydrateAuthUser<AuthUser>(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
