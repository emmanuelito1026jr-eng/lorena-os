import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-dark-card border border-white/10 p-8 text-center">
            <h1 className="text-4xl font-sans text-gold mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="text-left bg-dark p-4 rounded mb-6">
                <summary className="text-gold cursor-pointer mb-2">Error Details</summary>
                <pre className="text-xs text-gray-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
