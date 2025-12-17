import { Button } from 'nhsuk-react-components';
import { useState } from 'react';

interface FormButtonProps {
  children: React.ReactNode;
  onButtonClick: (e: React.FormEvent) => Promise<SubmitValidationResult>;
  disabled?: boolean;
}

export interface SubmitValidationResult {
  isSubmitValid: boolean;
}

export default function FormButton({
  onButtonClick,
  children,
  disabled
}: FormButtonProps) {
  const [internalDisabled, setInternalDisabled] = useState(false);

  const isButtonDisabled = internalDisabled || disabled;

  const handleClick = async (e: React.FormEvent) => {
    if (isButtonDisabled) return;

    setInternalDisabled(true);
    try {
      const validSubmit = await onButtonClick(e);
      if (!validSubmit.isSubmitValid) {
        focusErrorSummary();
      }
    } finally {
      setInternalDisabled(false);
    }
  };

  const focusErrorSummary = () => {
    const errorSummary = getErrorSummaryElement();
    if (errorSummary) {
      errorSummary.focus();
    }
  };

  const getErrorSummaryElement = (): HTMLElement | null => {
    return document.querySelector('.nhsuk-error-summary');
  };

  return (
    <Button onClick={handleClick} disabled={isButtonDisabled}>
      {children}
    </Button>
  );
}
