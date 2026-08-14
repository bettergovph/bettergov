import { render, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SEO from '../SEO';

const mockUseTranslation = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('SEO', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'en', resolvedLanguage: 'en' },
    });
  });

  it('sets DC.language from the active i18n locale', async () => {
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'fil', resolvedLanguage: 'fil' },
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/']}>
          <SEO />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(
        document
          .querySelector('meta[name="DC.language"]')
          ?.getAttribute('content')
      ).toBe('fil');
    });
  });

  it('updates DC.language when the active locale changes', async () => {
    const i18n = { language: 'en', resolvedLanguage: 'en' };
    mockUseTranslation.mockReturnValue({ i18n });

    const { rerender } = render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/']}>
          <SEO />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(
        document
          .querySelector('meta[name="DC.language"]')
          ?.getAttribute('content')
      ).toBe('en');
    });

    i18n.language = 'fil';
    i18n.resolvedLanguage = 'fil';
    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/']}>
          <SEO />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(
        document
          .querySelector('meta[name="DC.language"]')
          ?.getAttribute('content')
      ).toBe('fil');
    });
  });

  it('falls back to en when i18n language is unavailable', async () => {
    mockUseTranslation.mockReturnValue({
      i18n: { language: '', resolvedLanguage: '' },
    });

    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/']}>
          <SEO />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(
        document
          .querySelector('meta[name="DC.language"]')
          ?.getAttribute('content')
      ).toBe('en');
    });
  });
});
