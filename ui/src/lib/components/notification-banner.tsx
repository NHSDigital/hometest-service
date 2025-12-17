import classNames from 'classnames';

export interface NotificationBannerProps {
  title: string;
  role?: string;
  success?: boolean;
  disableAutoFocus?: boolean;
  content: string;
}

export const NotificationBannerComponent = ({
  title,
  role,
  success,
  disableAutoFocus,
  content
}: NotificationBannerProps) => {
  const id = 'nhsuk-notification-banner';
  const titleElementId = `${id}-title`;

  return (
    <div
      className={classNames('nhsuk-notification-banner', {
        'nhsuk-notification-banner--success': success
      })}
      aria-labelledby={titleElementId}
      data-module="nhsuk-notification-banner"
      data-disable-auto-focus={disableAutoFocus}
      role={role ?? (success ? 'alert' : 'region')}
      id={id}
    >
      <div className="nhsuk-notification-banner__header" id={titleElementId}>
        {title}
      </div>
      <div className="nhsuk-notification-banner__content">{content}</div>
    </div>
  );
};
