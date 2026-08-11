import { render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Contribute from '..';
import { ENTRY_POINTS } from '../entryPoints';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/contribute']}>
        <Contribute />
      </MemoryRouter>
    </HelmetProvider>
  );

describe('Contribute', () => {
  it('names the page once, in the hero', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /contribute to bettergov/i,
      })
    ).toBeInTheDocument();
  });

  /** Off-site actions carry an appended sr-only new-tab warning. */
  const linkFor = (action: string) =>
    screen.getByRole('link', { name: name => name.startsWith(action) });

  it('renders every entry point as its own action', () => {
    renderPage();

    for (const entry of ENTRY_POINTS) {
      expect(linkFor(entry.action), entry.id).toBeInTheDocument();
    }
  });

  it('lists the entry points in commitment order', () => {
    renderPage();

    const list = screen.getByRole('list', { name: /ways to contribute/i });
    const rendered = within(list)
      .getAllByRole('listitem')
      .map(item => within(item).getByRole('heading').textContent);

    expect(rendered).toEqual(ENTRY_POINTS.map(entry => entry.modeLabel));
  });

  it('opens off-site destinations in a new tab, and site pages in place', () => {
    renderPage();

    const offSite = linkFor('Review an open pull request');

    expect(offSite).toHaveAttribute('target', '_blank');
    expect(offSite).toHaveAccessibleName(/opens in a new tab/i);
    expect(linkFor('Join the Discord')).toHaveAttribute('href', '/discord');
  });

  it('links the volunteers address as a mail client handoff, not a new tab', () => {
    renderPage();

    const email = linkFor('Email the volunteers');

    expect(email).toHaveAttribute('href', 'mailto:volunteers@bettergov.ph');
    expect(email).not.toHaveAttribute('target');
  });
});
