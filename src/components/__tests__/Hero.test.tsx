import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Hero from '../v2/home/Hero';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../search/MeilisearchInstantSearch', () => ({
  default: () => <div data-testid='search' />,
}));

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>
  );

const hrefs = () =>
  screen.getAllByRole('link').map(a => a.getAttribute('href'));

describe('<Hero />', () => {
  it('renders every link on first paint, with no network access', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderHero();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('renders the exact popular-service URLs', () => {
    renderHero();
    expect(hrefs()).toEqual(
      expect.arrayContaining([
        '/services?category=certificates-ids&subcategory=id',
        '/services?category=certificates-ids&subcategory=certificates',
        '/services?category=business-trade&subcategory=business-registration',
      ])
    );
  });

  it('renders the exact category tile URLs', () => {
    renderHero();
    expect(hrefs()).toEqual(
      expect.arrayContaining([
        '/services?category=certificates-ids',
        '/services?category=business-trade',
        '/services?category=education',
        '/services?category=health',
      ])
    );
  });

  it('never renders an empty or partial href', () => {
    renderHero();
    for (const href of hrefs()) {
      expect(href).toBeTruthy();
      expect(href).not.toMatch(/category=(&|$)/);
      expect(href).not.toMatch(/subcategory=(&|$)/);
    }
  });
});
