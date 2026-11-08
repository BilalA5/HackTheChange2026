import { Component, type ErrorInfo, type ReactNode } from "react";
import { EmptyState } from "./Feedback";
import { Button } from "./Button";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called with the error for logging. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

/** Catches render errors below it and shows a recoverable message. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <EmptyState
        title="Something broke on this screen"
        body={error.message}
        action={
          <Button variant="glass" size="sm" onClick={this.reset}>
            Try again
          </Button>
        }
      />
    );
  }
}
