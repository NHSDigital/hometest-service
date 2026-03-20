interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Submitting your order" }: Readonly<LoadingSpinnerProps>) {
  return (
    <div className="loading-spinner-background">
      <div aria-hidden="true" className="loading-spinner" />
      <span className="nhsuk-u-visually-hidden" aria-live="polite">
        {message}
      </span>
      <h2 className="nhsuk-heading-m">{message}</h2>
    </div>
  );
}
