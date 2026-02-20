"use client";

// TODO: remove console.logs

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Data from NHS Login auth response
export interface AuthUser {
  sub: string;
  nhsNumber: string;
  birthdate: string;
  identityProofingLevel: string;
  phoneNumber: string;
  givenName: string;
  familyName: string;
}

// Address structure
export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postTown?: string;
  postcode?: string;
}

// Order state
export interface OrderAnswers {
  // From auth
  user?: AuthUser;

  // Address and LA lookup info
  postcodeSearch?: string;
  buildingNumber?: string;

  // Final delivery address
  deliveryAddress?: Address;
  comfortableDoingTest?: string;

  // Mobile number
  mobileNumber?: string;

  // Consent
  consentGiven?: boolean;
  consentTimestamp?: string;
}

interface CreateOrderContextType {
  orderAnswers: OrderAnswers;
  updateOrderAnswers: (updates: Partial<OrderAnswers>) => void;
  reset: () => void;
}

const CreateOrderContext = createContext<CreateOrderContextType | undefined>(undefined);

export function CreateOrderProvider({ children }: { children: ReactNode }) {
  const [orderAnswers, setOrderAnswers] = useState<OrderAnswers>({});

  const updateOrderAnswers = useCallback((updates: Partial<OrderAnswers>) => {
    console.log("[CreateOrderProvider] Updating with:", updates);
    setOrderAnswers((prev) => {
      const newState = { ...prev, ...updates };
      console.log("[CreateOrderProvider] New state:", newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setOrderAnswers({});
  }, []);

  return (
    <CreateOrderContext.Provider
      value={{
        orderAnswers,
        updateOrderAnswers,
        reset,
      }}
    >
      {children}
    </CreateOrderContext.Provider>
  );
}

export function useCreateOrderContext() {
  const context = useContext(CreateOrderContext);
  if (!context) {
    throw new Error("useCreateOrderContext must be used within a CreateOrderProvider");
  }
  return context;
}
