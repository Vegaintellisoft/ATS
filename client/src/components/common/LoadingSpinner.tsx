interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Loading…" }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner" />
      <span className="loading-spinner-text">{text}</span>
    </div>
  );
}
