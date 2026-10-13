import { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import SEO from '../../components/SEO';
import LocalityMap from '../../components/map/LocalityMap';
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from '../../../functions/api/gis-ph';

type LocalityResponse = {
  configured: boolean;
  level?: 'municity' | 'province';
  message?: string;
  code?: string;
  name?: string;
  provinceName?: string;
  outline?: GeoJsonFeature | null;
  areas?: GeoJsonFeatureCollection;
  barangays?: GeoJsonFeatureCollection;
};

const EMPTY_COLLECTION: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

function featureName(feature: GeoJsonFeature): string {
  const name = feature.properties?.name;
  return typeof name === 'string' ? name : 'Unnamed place';
}

function featureCode(feature: GeoJsonFeature): string {
  const code = feature.properties?.code;
  return typeof code === 'string' ? code : '';
}

function featureKind(feature: GeoJsonFeature): string {
  const kind = feature.properties?.type;
  if (typeof kind !== 'string' || !kind.trim()) return '';
  return kind.trim().toLowerCase() === 'municipal'
    ? 'Municipality'
    : kind.trim();
}

export default function LocalityMapPage() {
  const [locality, setLocality] = useState<LocalityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const isProvince = locality?.level === 'province';

  useEffect(() => {
    const base = (import.meta.env.VITE_GIS_API_BASE || '').replace(/\/$/, '');
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${base}/api/gis/locality`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as LocalityResponse;
        if (!response.ok) {
          setLocality(body);
          setError(
            body.message || `Could not load the map (${response.status}).`
          );
          return;
        }
        setLocality(body);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load the map.'
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const listedFeatures = useMemo(() => {
    if (isProvince) return locality?.areas?.features ?? [];
    return locality?.barangays?.features ?? [];
  }, [isProvince, locality]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listedFeatures;
    return listedFeatures.filter(feature => {
      const name = featureName(feature).toLowerCase();
      const code = featureCode(feature).toLowerCase();
      return name.includes(needle) || code.includes(needle);
    });
  }, [listedFeatures, query]);

  const mapFeatures = useMemo<GeoJsonFeatureCollection>(() => {
    if (isProvince && locality?.areas) return locality.areas;
    if (locality?.barangays) return locality.barangays;
    if (locality?.outline) {
      return { type: 'FeatureCollection', features: [locality.outline] };
    }
    return EMPTY_COLLECTION;
  }, [isProvince, locality]);

  const homeBoundary = useMemo<GeoJsonFeatureCollection>(() => {
    if (locality?.outline) {
      return { type: 'FeatureCollection', features: [locality.outline] };
    }
    return mapFeatures;
  }, [locality?.outline, mapFeatures]);

  const focusFeature = useMemo(() => {
    if (!selectedCode) return null;
    return (
      listedFeatures.find(feature => featureCode(feature) === selectedCode) ??
      null
    );
  }, [selectedCode, listedFeatures]);

  const searchLabel = isProvince
    ? 'Search cities and municipalities'
    : 'Search barangays';
  const countLabel = isProvince ? 'cities and municipalities' : 'barangays';

  const title = 'Administrative Map';

  return (
    <div className='bg-gray-50'>
      <SEO
        title={title}
        description='City and municipality boundaries for this local government, from GIS.ph.'
      />
      <div className='flex w-full flex-col lg:h-[calc(100dvh-8rem)] lg:flex-row'>
        <section className='flex max-h-[40vh] w-full flex-col border-b border-gray-200 bg-white lg:max-h-none lg:h-full lg:w-96 lg:shrink-0 lg:border-r lg:border-b-0'>
          <header className='border-b border-gray-100 px-4 py-4'>
            <h2 className='text-xl font-bold text-gray-900'>
              Administrative Map
            </h2>
          </header>

          {locality && (
            <>
              <div className='px-4 pt-4'>
                <label className='relative block'>
                  <span className='sr-only'>{searchLabel}</span>
                  <SearchIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='search'
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={searchLabel}
                    className='w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500'
                  />
                </label>
              </div>

              <div className='flex items-center justify-between gap-3 px-4 py-2'>
                <p className='text-xs text-gray-500'>
                  {loading
                    ? 'Loading…'
                    : `${filtered.length} of ${listedFeatures.length} ${countLabel}`}
                </p>
                {selectedCode && (
                  <button
                    type='button'
                    onClick={() => setSelectedCode(null)}
                    className='shrink-0 text-xs font-medium text-blue-700 hover:underline'
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </>
          )}

          {error && (
            <p className='mx-4 mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900'>
              {error}
            </p>
          )}

          {locality && (
            <ul className='flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto border-t border-gray-100 px-4 py-3'>
              {filtered.map(feature => {
                const code = featureCode(feature);
                const name = featureName(feature);
                const kind = featureKind(feature);
                const selected = code !== '' && code === selectedCode;
                return (
                  <li key={code || name}>
                    <button
                      type='button'
                      data-psgc={code}
                      title={kind || undefined}
                      aria-pressed={selected}
                      onClick={() => code && setSelectedCode(code)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        selected
                          ? 'border-blue-700 bg-blue-700 font-semibold text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className='relative min-h-[60vh] w-full flex-1 bg-white lg:min-h-0'>
          {mapFeatures.features.length > 0 || locality?.outline ? (
            <div className='absolute inset-0'>
              <LocalityMap
                features={mapFeatures}
                home={homeBoundary}
                focus={focusFeature}
                outline={locality?.outline ?? null}
                selectedCode={selectedCode}
                onSelect={setSelectedCode}
              />
            </div>
          ) : (
            <div className='flex h-full min-h-[60vh] items-center justify-center px-6 text-center text-sm text-gray-500'>
              {loading
                ? 'Loading the map…'
                : 'The map appears after GIS.ph returns this province or city.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
