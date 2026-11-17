import { fireEvent, render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import GuidesIndex from '../index';
import GuideArticle from '../GuideArticle';
import GuideMarkdown from '../GuideMarkdown';

vi.mock('../../../components/SEO', () => ({ default: () => null }));

function renderGuides(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path='/guides' element={<GuidesIndex />} />
          <Route path='/guides/:guideId' element={<GuideArticle />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('guides', () => {
  it('opens a complete article from a filtered guide card', async () => {
    renderGuides('/guides');
    fireEvent.click(screen.getByRole('button', { name: /^Health/ }));
    fireEvent.click(
      screen.getByRole('link', { name: /PhilHealth Member Registration/ })
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'PhilHealth Member Registration',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Member types' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'PhilHealth PIN application page' })
    ).toHaveAttribute(
      'href',
      'https://memberinquiry.philhealth.gov.ph/member/pinApplication.xhtml'
    );
  });

  it('keeps old topic links working and shows the UMID replacement', async () => {
    renderGuides('/guides?topic=umid');
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Applying for a MySSS Card (UMID replacement)',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Important change:')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'References' })
    ).toBeInTheDocument();
  });

  it('renders sourced tables and checklists with working section targets', () => {
    const { container } = renderGuides('/guides/tin');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Getting your TIN for the first time',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('.task-list-item').length
    ).toBeGreaterThan(0);
    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-09'
    );
    const navigation = screen.getByRole('navigation', { name: 'On this page' });
    for (const link of within(navigation).getAllByRole('link')) {
      expect(
        document.getElementById(link.getAttribute('href')!.slice(1))
      ).not.toBeNull();
    }
  });

  it('lets readers recover from an unknown guide URL', async () => {
    renderGuides('/guides/does-not-exist');
    expect(
      screen.getByRole('heading', { name: 'Guide not found' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Browse all guides' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Guides' })
    ).toBeInTheDocument();
  });

  it('preserves emphasis and rejects executable source markup', () => {
    const { container } = render(
      <GuideMarkdown>
        {
          '**Before you apply:** Prepare your documents.\n\n[Unsafe](javascript:alert%281%29)\n\n<script>alert(1)</script>'
        }
      </GuideMarkdown>
    );
    expect(screen.getByText('Before you apply:').tagName).toBe('STRONG');
    expect(container.querySelector('script')).toBeNull();
    expect(
      container.querySelector('a')?.getAttribute('href') ?? ''
    ).not.toMatch(/^javascript:/);
  });
});
