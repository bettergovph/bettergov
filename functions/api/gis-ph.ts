/** GIS.ph REST API. Override with GIS_PH_BASE_URL when a test needs another host. */
export const GIS_PH_API_URL = 'https://api.gis.ph';

/** Highest boundary resolution GIS.ph serves: simple, medium, or detailed. */
const GIS_PH_GEOMETRY = 'detailed';

export function gisPhBaseUrl(override?: string): string {
  return (override?.trim() || GIS_PH_API_URL).replace(/\/$/, '');
}

/**
 * Resolve GIS_PSGC_CODE to a city/municipality or a province.
 * A city or municipality returns its outline and barangays. A province returns
 * its cities and municipalities and stops there. This module never reads Vite env.
 */

export type GisLocalityEnv = {
  GIS_PH_API_KEY?: string;
  GIS_PSGC_CODE?: string;
  GIS_PH_BASE_URL?: string;
};

export type GeoJsonFeature = {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown> | null;
};

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
};

type Place = {
  name: string;
  code: string;
  provinceName: string;
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readPlace(body: unknown, fallbackCode: string): Place | null {
  const root = asRecord(body);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;
  const name = readString(data, 'name');
  const code = readString(data, 'code') || fallbackCode;
  if (!name) return null;
  return {
    name,
    code,
    provinceName: readString(data, 'province_name'),
  };
}

function isFeature(value: unknown): value is GeoJsonFeature {
  const record = asRecord(value);
  return record?.type === 'Feature';
}

function isCollection(value: unknown): value is GeoJsonFeatureCollection {
  const record = asRecord(value);
  return record?.type === 'FeatureCollection' && Array.isArray(record.features);
}

async function gisFetch(
  url: string,
  apiKey: string,
  fetchImpl: typeof fetch
): Promise<
  { ok: true; body: unknown } | { ok: false; status: number; message: string }
> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json, application/geo+json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { ok: false, status: 502, message };
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    const record = asRecord(body);
    const message =
      (typeof record?.message === 'string' && record.message) ||
      `GIS.ph responded ${response.status}`;
    return { ok: false, status: response.status, message };
  }

  return { ok: true, body };
}

function readConfig(
  env: GisLocalityEnv
):
  | { ok: true; apiKey: string; psgcCode: string; base: string }
  | { ok: false; response: Response } {
  const apiKey = env.GIS_PH_API_KEY?.trim() ?? '';
  const psgcCode = env.GIS_PSGC_CODE?.trim() ?? '';
  const base = gisPhBaseUrl(env.GIS_PH_BASE_URL);

  if (!apiKey || !psgcCode) {
    return {
      ok: false,
      response: json(
        {
          configured: false,
          message:
            'Set GIS_PH_API_KEY and GIS_PSGC_CODE on the server. The key is not read from the page.',
        },
        404
      ),
    };
  }

  if (!/^\d{9,10}$/.test(psgcCode)) {
    return {
      ok: false,
      response: json(
        {
          configured: true,
          message:
            'GIS_PSGC_CODE must be a 9 or 10 digit province, city, or municipality PSGC code.',
        },
        400
      ),
    };
  }

  return { ok: true, apiKey, psgcCode, base };
}

async function loadBarangays(
  base: string,
  apiKey: string,
  place: Place,
  fetchImpl: typeof fetch
): Promise<
  | { ok: true; barangays: GeoJsonFeatureCollection }
  | { ok: false; response: Response }
> {
  const barangayParams = new URLSearchParams({
    province: place.provinceName,
    municipality: place.name,
    format: 'geojson',
    geometry: GIS_PH_GEOMETRY,
  });
  const barangays = await gisFetch(
    `${base}/v1/barangays?${barangayParams.toString()}`,
    apiKey,
    fetchImpl
  );
  if (!barangays.ok) {
    return {
      ok: false,
      response: json(
        { configured: true, message: barangays.message },
        barangays.status
      ),
    };
  }
  if (!isCollection(barangays.body)) {
    return {
      ok: false,
      response: json(
        {
          configured: true,
          message: 'GIS.ph barangay response was not GeoJSON.',
        },
        502
      ),
    };
  }
  // GIS.ph treats municipality as a name prefix, so Santa also returns Santa Cruz.
  // l_code is the parent city or municipality PSGC. Keep a feature that has none.
  const features = barangays.body.features.filter(feature => {
    const parent = feature.properties?.l_code;
    return typeof parent !== 'string' || parent.trim() === place.code;
  });
  return { ok: true, barangays: { type: 'FeatureCollection', features } };
}

async function loadProvinceAreas(
  base: string,
  apiKey: string,
  place: Place,
  fetchImpl: typeof fetch
): Promise<
  | { ok: true; body: GeoJsonFeatureCollection }
  | { ok: false; response: Response }
> {
  // GIS.ph matches this filter on the province name. The PSGC code returns an empty collection.
  const filters = [place.name, place.code].filter(
    (value, index, all) => value && all.indexOf(value) === index
  );

  let last:
    | { ok: true; body: unknown }
    | { ok: false; status: number; message: string }
    | null = null;
  for (const province of filters) {
    const params = new URLSearchParams({
      province,
      format: 'geojson',
      geometry: GIS_PH_GEOMETRY,
    });
    last = await gisFetch(
      `${base}/v1/municities?${params.toString()}`,
      apiKey,
      fetchImpl
    );
    if (!last.ok) {
      return {
        ok: false,
        response: json(
          { configured: true, message: last.message },
          last.status
        ),
      };
    }
    if (isCollection(last.body) && last.body.features.length > 0) {
      return { ok: true, body: last.body };
    }
  }

  if (last?.ok && isCollection(last.body)) {
    return { ok: true, body: last.body };
  }
  return {
    ok: false,
    response: json(
      { configured: true, message: 'GIS.ph city response was not GeoJSON.' },
      502
    ),
  };
}

export async function handleGisLocality(
  env: GisLocalityEnv,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const config = readConfig(env);
  if (!config.ok) return config.response;
  const { apiKey, psgcCode, base } = config;

  const municityUrl = `${base}/v1/municities/${psgcCode}`;
  const municity = await gisFetch(municityUrl, apiKey, fetchImpl);
  if (municity.ok) {
    const place = readPlace(municity.body, psgcCode);
    if (!place?.provinceName) {
      return json(
        {
          configured: true,
          message:
            'GIS.ph did not return a city or municipality name and province for this PSGC code.',
        },
        422
      );
    }
    const barangays = await loadBarangays(base, apiKey, place, fetchImpl);
    if (!barangays.ok) return barangays.response;

    const outline = await gisFetch(
      `${municityUrl}?format=geojson&geometry=${GIS_PH_GEOMETRY}`,
      apiKey,
      fetchImpl
    );
    return json(
      {
        configured: true,
        level: 'municity',
        code: place.code,
        name: place.name,
        provinceName: place.provinceName,
        outline: outline.ok && isFeature(outline.body) ? outline.body : null,
        barangays: barangays.barangays,
      },
      200
    );
  }
  if (municity.status !== 404) {
    return json(
      { configured: true, message: municity.message },
      municity.status
    );
  }

  const provinceUrl = `${base}/v1/provinces/${psgcCode}`;
  const province = await gisFetch(provinceUrl, apiKey, fetchImpl);
  if (!province.ok) {
    const message =
      province.status === 404
        ? 'That PSGC code is not a province, city, or municipality.'
        : province.message;
    return json({ configured: true, message }, province.status);
  }

  const place = readPlace(province.body, psgcCode);
  if (!place) {
    return json(
      {
        configured: true,
        message: 'GIS.ph did not return a province name for this PSGC code.',
      },
      422
    );
  }

  const areas = await loadProvinceAreas(base, apiKey, place, fetchImpl);
  if (!areas.ok) return areas.response;

  const outline = await gisFetch(
    `${provinceUrl}?format=geojson&geometry=${GIS_PH_GEOMETRY}`,
    apiKey,
    fetchImpl
  );
  return json(
    {
      configured: true,
      level: 'province',
      code: place.code,
      name: place.name,
      provinceName: place.name,
      outline: outline.ok && isFeature(outline.body) ? outline.body : null,
      areas: areas.body,
    },
    200
  );
}
