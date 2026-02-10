import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/normal content/i)).toBeInTheDocument();
  });

  it('displays error UI when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/try refreshing the page/i)).toBeInTheDocument();
  });

  it('displays error details in expandable section', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsElement = screen.getByText(/error details/i);
    expect(detailsElement).toBeInTheDocument();

    // The error message should be in the details
    const details = detailsElement.closest('details');
    expect(details).toBeInTheDocument();
  });

  it('provides a refresh button', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(reloadSpy).toHaveBeenCalled();
  });
});
