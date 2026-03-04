"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { registerDebugState } from "@/lib/utils/debug";
import { AuthUser } from "./AuthContext";

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
  // Address and LA lookup info
  postcodeSearch?: string;
  buildingNumber?: string;
  selectedAddressId?: string;

  // Final delivery address
  deliveryAddress?: Address;
  addressEntryMethod?: 'postcode-search' | 'manual';

  comfortableDoingTest?: string;

  // From LA Lookup
  localAuthority?: {
    code: string;
    region: string;
  };

  supplier?: {
    id: string;
    name: string;
    testCode: string;
  }[];

  // Mobile number
  mobileNumber?: string;
  mobileNumberSource?: 'nhs-login' | 'manual';

  // Consent
  consentGiven?: boolean;
  consentTimestamp?: string;

  // Order confirmation
  orderReferenceNumber?: string;
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
    setOrderAnswers((prev) => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    registerDebugState('order', () => orderAnswers);
  }, [orderAnswers]);

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
