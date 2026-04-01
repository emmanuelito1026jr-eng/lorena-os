import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from '../lib/i18n';

interface Props {
  children: ReactNode;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/* Functional wrapper that provides translated strings to the class component */
const ErrorDisplay = ({
  error,
  inline,
  onRetry,
  onReload,
}: {
  error: Error | null;
  inline: boolean;
  onRetry: () => void;
  onReload: () => void;
}) => {
  const { t } = useTranslation();

  if (inline) {
    return (
      <div className="min-h-[400px] bg-white rounded-xl border border-dashboard-border flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center py-12">
          <h2 className="text-xl font-playfair font-semibold text-dashboard-heading mb-2">
            {t('errorBoundary.inlineTitle')}
          </h2>
          <p className="font-lato text-sm text-dashboard-secondary mb-6">
            {t('errorBoundary.inlineMessage')}
          </p>
          {import.meta.env.DEV && error && (
            <details className="text-left bg-dashboard-offwhite p-3 rounded-lg mb-6">
              <summary className="font-lato text-xs font-medium text-dashboard-secondary cursor-pointer mb-1">
                {t('errorBoundary.errorDetails')}
              </summary>
              <pre className="text-xs text-dashboard-body overflow-auto">
                {error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-dashboard-gold hover:bg-[#B8952F] text-white font-lato font-medium text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {t('errorBoundary.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-black/90 border border-white/10 p-8 text-center">
        <h1 className="text-4xl font-playfair text-gold mb-4">
          {t('errorBoundary.title')}
        </h1>
        <p className="text-white/80 mb-6">
          {t('errorBoundary.message')}
        </p>
        {import.meta.env.DEV && error && (
          <details className="text-left bg-black/80 p-4 rounded mb-6">
            <summary className="text-gold cursor-pointer mb-2">
              {t('errorBoundary.errorDetails')}
            </summary>
            <pre className="text-xs text-white/60 overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
        <button
          onClick={onReload}
          className="px-8 py-4 bg-gold text-dark font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300"
        >
          {t('errorBoundary.refreshPage')}
        </button>
      </div>
    </div>
  );
};

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
        <ErrorDisplay
          error={this.state.error}
          inline={!!this.props.inline}
          onRetry={() => this.setState({ hasError: false, error: null })}
          onReload={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
