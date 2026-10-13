import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LocalityMapPage from '..';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', resolvedLanguage: 'en' },
  }),
}));

vi.mock('../../../components/map/LocalityMap', () => ({
  default: () => <div data-testid='map-canvas' />,
}));

const city = {
  configured: true,
  level: 'municity' as const,
  code: '0701201000',
  name: 'Alburquerque',
  provinceName: 'Bohol',
  outline: {
    type: 'Feature' as const,
    geometry: { type: 'Polygon', coordinates: [] },
    properties: { name: 'Alburquerque', code: '0701201000' },
  },
  barangays: {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: null,
        properties: { name: 'Bahi', code: '0701201001' },
      },
      {
        type: 'Feature' as const,
        geometry: null,
        properties: { name: 'Poblacion', code: '0701201020' },
      },
    ],
  },
};

describe('LocalityMapPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => city,
      }))
    );
  });

  it('lists barangay pills when the PSGC code is a city or municipality', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <LocalityMapPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(
      await screen.findByRole('button', { name: 'Bahi' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Administrative Map' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/PSGC/)).not.toBeInTheDocument();
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search barangays' }),
      {
        target: { value: 'bah' },
      }
    );
    expect(screen.getByRole('button', { name: 'Bahi' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Poblacion' })
    ).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/gis/locality', expect.any(Object));
  });

  it('searches cities for a province and does not load barangays', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          configured: true,
          level: 'province',
          code: '0701200000',
          name: 'Bohol',
          provinceName: 'Bohol',
          outline: null,
          areas: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: null,
                properties: {
                  name: 'Alburquerque',
                  code: '0701201000',
                  type: 'Municipal',
                },
              },
              {
                type: 'Feature',
                geometry: null,
                properties: {
                  name: 'Alicia',
                  code: '0701202000',
                  type: 'Municipal',
                },
              },
            ],
          },
        }),
      }))
    );

    render(
      <HelmetProvider>
        <MemoryRouter>
          <LocalityMapPage />
        </MemoryRouter>
      </HelmetProvider>
    );

    expect(
      await screen.findByRole('heading', { name: 'Administrative Map' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/PSGC/)).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Alicia/ })
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search cities and municipalities',
      }),
      { target: { value: 'ali' } }
    );
    expect(screen.getByRole('button', { name: /Alicia/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Alburquerque/ })
    ).not.toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', {
        name: 'Search cities and municipalities',
      }),
      { target: { value: '' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Alburquerque/ }));
    expect(
      screen.getByRole('button', { name: /Alburquerque/ })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Alicia/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(
      screen.getByRole('button', { name: /Alburquerque/ })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/gis/barangays'),
      expect.anything()
    );
  });
});
