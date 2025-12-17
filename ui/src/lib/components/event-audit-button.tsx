import { useState } from 'react';
import {
  type IEventAuditRequest,
  useAuditEvent
} from '../../hooks/eventAuditHook';
import FormButton, { type SubmitValidationResult } from './FormButton';

export function EventAuditButton({
  auditEvents,
  onClick,
  children
}: {
  auditEvents: IEventAuditRequest[];
  onClick: () => Promise<boolean | void>;
  children: React.ReactNode;
}) {
  const { triggerAuditEvent } = useAuditEvent();
  const [isDisabled, setIsDisabled] = useState(false);

  const handleNext = async (): Promise<SubmitValidationResult> => {
    if (isDisabled) return { isSubmitValid: false };

    setIsDisabled(true);
    try {
      const result = await onClick();
      if (result !== false) {
        for (const auditEvent of auditEvents) {
          await triggerAuditEvent(auditEvent); // Ensure each audit is completed.
        }
        return { isSubmitValid: true };
      }
    } catch (error) {
      console.error('Error during event auditing:', error);
    } finally {
      setIsDisabled(false);
    }
    return { isSubmitValid: false };
  };

  return (
    <FormButton onButtonClick={handleNext} disabled={isDisabled}>
      {children}
    </FormButton>
  );
}
