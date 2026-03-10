import React, { ReactNode, createContext, useCallback, useContext, useState } from "react";
import { backendUrl } from "@/settings";

export interface AddressResult {
  id: string;
  line1: string;
  line2?: string;
  line3?: string;
  town: string;
  postcode: string;
  fullAddress: string;
}

export interface PostcodeLookupContextType {
  postcode: string;
  addresses: AddressResult[];
  selectedAddress: AddressResult | null;
  isLoading: boolean;
  lookupResultsStatus: "idle" | "found" | "not_found" | "error";
  error: string | null;
  lookupPostcode: (postcode: string) => Promise<void>;
  setSelectedAddress: (address: AddressResult | null) => void;
  clearAddresses: () => void;
}

export const PostcodeLookupContext = createContext<PostcodeLookupContextType | undefined>(
  undefined,
);

interface PostcodeLookupProviderProps {
  children: ReactNode;
}

export const PostcodeLookupProvider: React.FC<PostcodeLookupProviderProps> = ({ children }) => {
  const [postcode, setPostcode] = useState<string>("");
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lookupResultsStatus, setLookupResultsStatus] = useState<
    "idle" | "found" | "not_found" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const lookupPostcode = async (postcodeValue: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setAddresses([]);

    try {
      const url = new URL(`${backendUrl}/postcode-lookup`);
      url.searchParams.append("postcode", postcodeValue);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to lookup postcode");
      }

      const data = await response.json();
      const foundAddresses = data.addresses || [];
      setAddresses(foundAddresses);
      setPostcode(postcodeValue);
      setLookupResultsStatus(foundAddresses.length > 0 ? "found" : "not_found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setAddresses([]);
      setLookupResultsStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddresses = useCallback((): void => {
    setAddresses([]);
    setSelectedAddress(null);
    setPostcode("");
    setLookupResultsStatus("idle");
    setError(null);
  }, []);

  const value: PostcodeLookupContextType = {
    postcode,
    addresses,
    selectedAddress,
    isLoading,
    lookupResultsStatus,
    error,
    lookupPostcode,
    setSelectedAddress,
    clearAddresses,
  };

  return <PostcodeLookupContext.Provider value={value}>{children}</PostcodeLookupContext.Provider>;
};

export const usePostcodeLookup = (): PostcodeLookupContextType => {
  const context = useContext(PostcodeLookupContext);

  if (context === undefined) {
    throw new Error("usePostcodeLookup must be used within a PostcodeLookupProvider");
  }

  return context;
};
