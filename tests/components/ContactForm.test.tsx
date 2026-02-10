import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../../components/ContactForm';

// Mock environment variable
vi.stubEnv('VITE_WEBHOOK_URL', 'https://test-webhook.com/submit');

describe('ContactForm', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it('renders form with all fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am interested in/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/phone number is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
  });

  it('validates phone number format', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '123');

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(await screen.findByText(/valid 10-digit phone number/i)).toBeInTheDocument();
  });

  it('formats phone number as user types', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement;
    await user.type(phoneInput, '9154875581');

    expect(phoneInput.value).toBe('(915) 487-5581');
  });

  it('clears errors when user starts typing', async () => {
    render(<ContactForm />);
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'John');

    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );

    render(<ContactForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '9154875581');

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-webhook.com/submit',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('displays error message on submission failure', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<ContactForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '9154875581');

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });
});
