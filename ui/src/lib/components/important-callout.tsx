/**
 * This component is created to resolve an issue in the original WarningCallout component,
 * where the word "Important" is read multiple times by VoiceOver, and "2 items" is announced,
 * even though there is only one header.
 *
 * It can be removed once the original component from the nhsuk-react-components is VoiceOver friendly.
 */
import { WarningCallout } from 'nhsuk-react-components';
import React, { type ReactNode } from 'react';

interface ImportantCalloutProps {
  children: ReactNode;
  title?: string;
}

export const ImportantCallout: React.FC<ImportantCalloutProps> = ({
  children,
  title
}) => {
  const header = title ?? 'Important';
  return (
    <>
      <WarningCallout>
        <WarningCallout.Label aria-label={header}>
          <span aria-hidden="true">{header}</span>
        </WarningCallout.Label>
        {children}
      </WarningCallout>
    </>
  );
};
