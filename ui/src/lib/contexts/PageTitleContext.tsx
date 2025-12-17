import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useMemo
} from 'react';

interface PageTitleContextProps {
  isPageInError: boolean;
  setIsPageInError: (isError: boolean) => void;
  currentStep: string | undefined;
  setCurrentStep: (step: string | undefined) => void;
}

const PageTitleContext = createContext<PageTitleContextProps | undefined>(
  undefined
);

export const PageTitleProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [isPageInError, setIsPageInError] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | undefined>(undefined);
  const obj = useMemo(
    () => ({
      isPageInError,
      setIsPageInError,
      currentStep,
      setCurrentStep
    }),
    [isPageInError, currentStep]
  );
  return (
    <PageTitleContext.Provider value={obj}>
      {children}
    </PageTitleContext.Provider>
  );
};

export const usePageTitleContext = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error(
      'usePageTitleContext must be used within an PageTitleProvider'
    );
  }
  return context;
};
