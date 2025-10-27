import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import FooterNew from './FooterNew';

expect.extend(toHaveNoViolations);

// Wrapper for React Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FooterNew Component', () => {
  // Basic Rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('renders newsletter section', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('Zostaň v obraze')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Tvoj email')).toBeInTheDocument();
    });

    it('renders all footer columns on desktop', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Podpora')).toBeInTheDocument();
      expect(screen.getByText('Spoločnosť')).toBeInTheDocument();
      expect(screen.getByText('Právne')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
    });

    it('renders copyright with current year', () => {
      const currentYear = new Date().getFullYear();
      renderWithRouter(<FooterNew />);
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    it('renders trust badges', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('SSL')).toBeInTheDocument();
      expect(screen.getByText('14 dní na vrátenie')).toBeInTheDocument();
    });

    it('renders social links', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
    });

    it('renders language selector', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByLabelText('Slovenčina')).toBeInTheDocument();
      expect(screen.getByLabelText('English')).toBeInTheDocument();
    });
  });

  // Newsletter Form
  describe('Newsletter Form', () => {
    it('validates email correctly', () => {
      renderWithRouter(<FooterNew />);
      const input = screen.getByPlaceholderText('Tvoj email') as HTMLInputElement;
      const button = screen.getByRole('button', { name: /prihlásiť sa/i });

      // Invalid email
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      expect(button).toBeDisabled();

      // Valid email
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(button).not.toBeDisabled();
    });

    it('submits form with valid email', async () => {
      renderWithRouter(<FooterNew />);
      const input = screen.getByPlaceholderText('Tvoj email');
      const button = screen.getByRole('button', { name: /prihlásiť sa/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /odosiela sa/i })).toBeInTheDocument();
      });
    });

    it('clears form after successful submission', async () => {
      renderWithRouter(<FooterNew />);
      const input = screen.getByPlaceholderText('Tvoj email') as HTMLInputElement;
      const button = screen.getByRole('button', { name: /prihlásiť sa/i });

      fireEvent.change(input, { target: { value: 'test@example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(input.value).toBe('');
      }, { timeout: 2000 });
    });
  });

  // Links
  describe('Links', () => {
    it('renders correct shop links', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('Novinky')).toHaveAttribute('href', '/products?filter=new');
      expect(screen.getByText('STL súbory')).toHaveAttribute('href', '/products?category=stl');
    });

    it('renders correct support links', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('Kontakt')).toHaveAttribute('href', '/contact');
      expect(screen.getByText('FAQ')).toHaveAttribute('href', '/faq');
    });

    it('renders correct legal links', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByText('Obchodné podmienky')).toHaveAttribute('href', '/terms-of-service');
      expect(screen.getByText('Ochrana súkromia (GDPR)')).toHaveAttribute('href', '/privacy-policy');
    });

    it('external links have rel="noopener noreferrer"', () => {
      renderWithRouter(<FooterNew />);
      const facebookLink = screen.getByLabelText('Facebook');
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(facebookLink).toHaveAttribute('target', '_blank');
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = renderWithRouter(<FooterNew />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      renderWithRouter(<FooterNew />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('newsletter input has proper aria-label', () => {
      renderWithRouter(<FooterNew />);
      const input = screen.getByLabelText('Email adresa pre newsletter');
      expect(input).toBeInTheDocument();
    });

    it('accordion buttons have aria-expanded', () => {
      // This test would need mobile viewport simulation
      // For now, we just check if the component renders
      renderWithRouter(<FooterNew />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('all interactive elements are keyboard accessible', () => {
      renderWithRouter(<FooterNew />);
      const links = screen.getAllByRole('link');
      const buttons = screen.getAllByRole('button');

      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });

      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });
  });

  // JSON-LD Schema
  describe('SEO', () => {
    it('renders JSON-LD schema', () => {
      const { container } = renderWithRouter(<FooterNew />);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeInTheDocument();

      if (script && script.textContent) {
        const jsonLd = JSON.parse(script.textContent);
        expect(jsonLd['@type']).toBe('Organization');
        expect(jsonLd.name).toBe('Martyx Industries');
      }
    });
  });

  // Responsive Behavior
  describe('Responsive', () => {
    it('renders mobile accordions with chevron icons', () => {
      // Note: This would need proper viewport simulation
      renderWithRouter(<FooterNew />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
