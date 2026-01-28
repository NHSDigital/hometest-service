"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Data from NHS Login auth response
export interface IAuthUser {
  sub: string;
  nhsNumber: string;
  birthdate: string;
  identityProofingLevel: string;
  phoneNumber: string;
}

// Address structure
export interface IAddress {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postTown?: string;
  postcode?: string;
}

// Order state
export interface IOrderAnswers {
  // From auth
  user?: IAuthUser;

  // From enter-delivery-address
  postcodeSearch?: string;
  buildingNumber?: string;

  // Final delivery address
  deliveryAddress?: IAddress;
}

interface OrderContextType {
  orderAnswers: IOrderAnswers;
  updateOrderAnswers: (updates: Partial<IOrderAnswers>) => void;
  reset: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderAnswers, setOrderAnswers] = useState<IOrderAnswers>({});

  const updateOrderAnswers = useCallback((updates: Partial<IOrderAnswers>) => {
    console.log("[OrderProvider] Updating with:", updates);
    setOrderAnswers((prev) => {
      const newState = { ...prev, ...updates };
      console.log("[OrderProvider] New state:", newState);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setOrderAnswers({});
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orderAnswers,
        updateOrderAnswers,
        reset,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrderContext must be used within an OrderProvider");
  }
  return context;
}