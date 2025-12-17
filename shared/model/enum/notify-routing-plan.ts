export enum NotificationTemplate {
  ALL_RESULTS = 'ALL_RESULTS',
  SOME_RESULTS = 'SOME_RESULTS',
  NUDGE_INITIAL_AFTER_START = 'NUDGE_INITIAL_AFTER_START',
  HEALTH_CHECK_AUTO_EXPIRED = 'HEALTH_CHECK_AUTO_EXPIRED'
}

export type NotifyRoutingPlanIdMap = Record<NotificationTemplate, string>;
