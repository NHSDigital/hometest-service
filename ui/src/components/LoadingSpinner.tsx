interface LoadingSpinnerProps {
  message?: string;
  variant?: "overlay" | "inline";
}

export function LoadingSpinner({
  message = "Loading",
  variant = "overlay",
}: Readonly<LoadingSpinnerProps>) {
  const containerClass =
    variant === "inline" ? "loading-spinner-inline" : "loading-spinner-background";

  return (
    <div className={containerClass}>
      <div aria-hidden="true" className="loading-spinner" />
      <h2 className="nhsuk-heading-m" role="status" aria-live="polite">
        {message}
      </h2>
    </div>
  );
}
