import {
  type IEventAuditRequest,
  useAuditEvent
} from '../../hooks/eventAuditHook';
import { AuditEventType, type IHealthCheck } from '@dnhc-health-checks/shared';

export enum OpenedFrom {
  ResultsBMI = 'results.bmi',
  ResultsBloodPressure = 'results.blood-pressure',
  ResultsCholesterol = 'results.cholesterol',
  ResultsDiabetes = 'results.diabetes',
  ResultsAlcohol = 'results.alcohol',
  ResultsPhysicalActivity = 'results.physicalActivity',
  ResultsSmoking = 'results.smoking',
  ResultsDementia = 'results.dementia'
}

interface ExternalResourceOpenedAuditEvent extends IEventAuditRequest {
  eventType: AuditEventType.ExternalResourceOpened;
  openedFrom: OpenedFrom;
  healthCheck?: IHealthCheck;
}

interface OpensInNewTabAuditEvent extends IEventAuditRequest {
  eventType: Exclude<AuditEventType, AuditEventType.ExternalResourceOpened>;
  healthCheck?: IHealthCheck;
}

type TriggeredAuditEvent =
  | ExternalResourceOpenedAuditEvent
  | OpensInNewTabAuditEvent;

interface OpensInNewTabLinkProps {
  linkHref: string;
  linkText: string;
  includeNewTabMessage?: boolean;
  onClick?: () => Promise<void>;
  auditEventTriggeredOnClick?: TriggeredAuditEvent;
}

export interface NewTabLinkArray {
  id: number;
  resource: OpensInNewTabLinkProps;
}

function getAuditEventDetails(
  auditEventTriggeredOnClick: TriggeredAuditEvent,
  linkText: string
) {
  if (
    auditEventTriggeredOnClick.eventType ===
    AuditEventType.ExternalResourceOpened
  ) {
    return {
      ...auditEventTriggeredOnClick.details,
      openedFrom: auditEventTriggeredOnClick.openedFrom,
      resourceTitle: linkText
    };
  }
  return auditEventTriggeredOnClick.details;
}

export function OpensInNewTabLink({
  linkHref,
  linkText,
  includeNewTabMessage = true,
  onClick,
  auditEventTriggeredOnClick
}: Readonly<OpensInNewTabLinkProps>) {
  const { triggerAuditEvent } = useAuditEvent();
  const handleClick = async () => {
    if (auditEventTriggeredOnClick) {
      void triggerAuditEvent({
        eventType: auditEventTriggeredOnClick.eventType,
        healthCheck: auditEventTriggeredOnClick.healthCheck,
        patientId: auditEventTriggeredOnClick.patientId,
        details: getAuditEventDetails(auditEventTriggeredOnClick, linkText)
      });
    }
    if (onClick) {
      await onClick();
    }
  };

  return (
    <a
      target="_blank"
      href={linkHref}
      rel="noreferrer noopener"
      onClick={handleClick}
    >
      {linkText}
      {includeNewTabMessage && ' (opens in new tab)'}
      {!includeNewTabMessage && (
        <span className="nhsuk-u-visually-hidden">(opens in new tab)</span>
      )}
    </a>
  );
}

export function OpensInNewTabLinkArray(
  resources: NewTabLinkArray[],
  includeNewTabMessageToAllTabs?: boolean,
  auditEventTriggeredOnClick?: TriggeredAuditEvent
) {
  return (
    <>
      {resources.map((element) => (
        <p key={element.id}>
          <OpensInNewTabLink
            linkHref={element.resource.linkHref}
            linkText={element.resource.linkText}
            includeNewTabMessage={
              element.resource.includeNewTabMessage ??
              includeNewTabMessageToAllTabs
            }
            auditEventTriggeredOnClick={
              element.resource.auditEventTriggeredOnClick ??
              auditEventTriggeredOnClick
            }
            onClick={element.resource.onClick}
          />
        </p>
      ))}
    </>
  );
}
