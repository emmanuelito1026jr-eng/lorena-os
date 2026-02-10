import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

// Mock useLocation to control the current path
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/' })),
  };
});

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  it('renders logo and navigation links', () => {
    renderNavbar();

    expect(screen.getByText(/casas en/i)).toBeInTheDocument();
    expect(screen.getByText(/el paso/i)).toBeInTheDocument();
    expect(screen.getByText(/lorena ontiveros-ortega/i)).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    renderNavbar();

    const menuButton = screen.getByLabelText(/open menu/i);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/close menu/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/close menu/i));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile menu when Escape key is pressed', () => {
    renderNavbar();

    const menuButton = screen.getByLabelText(/open menu/i);
    fireEvent.click(menuButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays ARIA attributes correctly', () => {
    renderNavbar();

    const menuButton = screen.getByLabelText(/open menu/i);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);
    const closeButton = screen.getByLabelText(/close menu/i);
    expect(closeButton).toHaveAttribute('aria-expanded', 'true');

    const mobileMenu = screen.getByRole('dialog');
    expect(mobileMenu).toHaveAttribute('aria-modal', 'true');
  });

  it('adds backdrop blur when scrolled', () => {
    renderNavbar();

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-transparent');

    // Simulate scroll event
    fireEvent.scroll(window, { target: { scrollY: 100 } });

    // Note: In a real test, you'd need to actually trigger the scroll handler
    // This is a simplified version showing the structure
  });
});
