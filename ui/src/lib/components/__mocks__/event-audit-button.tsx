import { Button } from 'nhsuk-react-components';
import { type IEventAuditRequest } from '../../../hooks/eventAuditHook';
import type React from 'react';
export function EventAuditButton({
  auditEvents,
  onClick,
  children
}: Readonly<{
  auditEvents: IEventAuditRequest[];
  onClick: () => Promise<void>;
  children: React.ReactNode;
}>) {
  function handleOnClick() {
    void onClick();
  }
  return (
    <>
      <Button onClick={handleOnClick}>{children}</Button>
      <div>{JSON.stringify(auditEvents)}</div>
    </>
  );
}
