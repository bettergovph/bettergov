import { describe, expect, it, vi } from 'vitest';
import { handleGisLocality } from '../../../functions/api/gis-ph';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('handleGisLocality', () => {
  it('does not call GIS.ph when the key or PSGC code is missing', async () => {
    const fetchImpl = vi.fn();
    const response = await handleGisLocality(
      { GIS_PSGC_CODE: '0701201000' },
      fetchImpl
    );
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.configured).toBe(false);
  });

  it('loads barangays when the PSGC code is a city or municipality', async () => {
    let authorization = '';
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const headers = init?.headers as Record<string, string> | undefined;
        authorization = headers?.Authorization ?? '';
        if (url.endsWith('/v1/municities/0701201000')) {
          return jsonResponse({
            data: {
              name: 'Alburquerque',
              province_name: 'Bohol',
              code: '0701201000',
            },
            error: null,
          });
        }
        if (url.includes('/v1/barangays')) {
          expect(url).toContain('province=Bohol');
          expect(url).toContain('municipality=Alburquerque');
          expect(url).toContain('geometry=detailed');
          return jsonResponse({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [] },
                properties: { name: 'Bahi', code: '0701201001' },
              },
            ],
          });
        }
        if (url.includes('format=geojson')) {
          return jsonResponse({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [] },
            properties: { name: 'Alburquerque', code: '0701201000' },
          });
        }
        throw new Error(`unexpected ${url}`);
      }
    );

    const response = await handleGisLocality(
      { GIS_PH_API_KEY: 'test-key', GIS_PSGC_CODE: '0701201000' },
      fetchImpl
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.level).toBe('municity');
    expect(body.name).toBe('Alburquerque');
    expect(body.provinceName).toBe('Bohol');
    expect(body.barangays.features).toHaveLength(1);
    expect(body.outline.properties.code).toBe('0701201000');
    expect(authorization).toBe('Bearer test-key');
  });

  it('drops barangays whose parent municipality is only a name prefix', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/municities/0102922000')) {
        return jsonResponse({
          data: {
            name: 'Santa',
            province_name: 'Ilocos Sur',
            code: '0102922000',
          },
          error: null,
        });
      }
      if (url.includes('/v1/barangays')) {
        return jsonResponse({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: null,
              properties: {
                name: 'Poblacion',
                code: '0102922001',
                l_code: '0102922000',
              },
            },
            {
              type: 'Feature',
              geometry: null,
              properties: { name: 'Uncoded', code: '0102922099' },
            },
            {
              type: 'Feature',
              geometry: null,
              properties: {
                name: 'Cabaroan',
                code: '0102923001',
                l_code: '0102923000',
              },
            },
          ],
        });
      }
      if (url.includes('format=geojson')) {
        return jsonResponse({
          type: 'Feature',
          geometry: null,
          properties: { name: 'Santa', code: '0102922000' },
        });
      }
      throw new Error(`unexpected ${url}`);
    });

    const response = await handleGisLocality(
      { GIS_PH_API_KEY: 'test-key', GIS_PSGC_CODE: '0102922000' },
      fetchImpl
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(
      body.barangays.features.map(
        (feature: { properties: { name: string } }) => feature.properties.name
      )
    ).toEqual(['Poblacion', 'Uncoded']);
  });

  it('loads cities for a province code instead of every barangay', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/municities/0701200000')) {
        return jsonResponse({ message: 'Not Found' }, 404);
      }
      if (url.endsWith('/v1/provinces/0701200000')) {
        return jsonResponse({
          data: { name: 'Bohol', code: '0701200000' },
          error: null,
        });
      }
      if (url.includes('/v1/municities?')) {
        expect(url).toContain('province=Bohol');
        expect(url).not.toContain('/v1/barangays');
        return jsonResponse({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [] },
              properties: { name: 'Alburquerque', code: '0701201000' },
            },
          ],
        });
      }
      if (url.includes('/v1/provinces/0701200000?format=geojson')) {
        return jsonResponse({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: { name: 'Bohol', code: '0701200000' },
        });
      }
      throw new Error(`unexpected ${url}`);
    });

    const response = await handleGisLocality(
      { GIS_PH_API_KEY: 'test-key', GIS_PSGC_CODE: '0701200000' },
      fetchImpl
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.level).toBe('province');
    expect(body.name).toBe('Bohol');
    expect(body.areas.features).toHaveLength(1);
    expect(body.barangays).toBeUndefined();
  });
});
