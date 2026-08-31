import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface Props {
  children?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundaryInner extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state whenever the route changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <h2>Oops, something went wrong!</h2>
          <details style={{ whiteSpace: "pre-wrap", textAlign: "left", background: "rgba(0,0,0,0.1)", padding: "15px", borderRadius: "8px", maxWidth: "800px", marginTop: "20px" }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#007bff", color: "white", fontWeight: "bold" }}
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "10px", padding: "10px 20px", cursor: "pointer", borderRadius: "5px", border: "1px solid #666", background: "transparent", color: "#ccc", fontWeight: "bold" }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap with a functional component to access useLocation hook
function ErrorBoundary({ children }: { children?: ReactNode }) {
  const location = useLocation();
  return (
    <ErrorBoundaryInner resetKey={location.pathname}>
      {children}
    </ErrorBoundaryInner>
  );
}

export default ErrorBoundary;
