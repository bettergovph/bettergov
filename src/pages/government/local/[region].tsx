import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SearchIcon, MapPinIcon, UserIcon, CrownIcon } from 'lucide-react';
import {
  loadRegionLgu,
  RegionLGU,
  Province,
  City,
  Municipality,
} from '../../../lib/lgu';
import {
  CardGrid,
  Card,
  CardContent,
  CardTitle,
  CardContactInfo,
  CardAvatar,
} from '../../../components/ui/CardList';
import SEO from '../../../components/SEO';
import { getLocalGovSEOData } from '../../../utils/seo-data';

export default function RegionalLGUPage() {
  const { region } = useParams<{ region: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  // Load region data dynamically from per-region JSON files
  const [regionData, setRegionData] = useState<RegionLGU | null>(null);
  useEffect(() => {
    let isActive = true;
    (async () => {
      const data = await loadRegionLgu(region);
      if (isActive) setRegionData(data);
    })();
    return () => {
      isActive = false;
    };
  }, [region]);

  // Flatten all cities and municipalities from all provinces
  const allLocalGovUnits = useMemo(() => {
    if (!regionData) return [];

    interface Unit {
      city?: string;
      mayor?: { name?: string; contact?: string };
      vice_mayor?: { name?: string; contact?: string };
      type: 'City' | 'Municipality';
      province: string | null;
    }
    const units: Unit[] = [];

    // Add direct cities (if any)
    if (regionData.cities) {
      regionData.cities.forEach((city: City) => {
        units.push({ ...city, type: 'City', province: null });
      });
    }

    // Add direct municipalities (if any)
    if (regionData.municipalities) {
      regionData.municipalities.forEach((municipality: Municipality) => {
        units.push({
          city: municipality.municipality,
          mayor: municipality.mayor,
          vice_mayor: municipality.vice_mayor,
          type: 'Municipality',
          province: null,
        });
      });
    }

    // Add cities and municipalities from provinces (if any)
    if (regionData.provinces) {
      regionData.provinces.forEach((province: Province) => {
        if (province.cities) {
          province.cities.forEach((city: City) => {
            units.push({ ...city, type: 'City', province: province.province });
          });
        }
        if (province.municipalities) {
          province.municipalities.forEach((municipality: Municipality) => {
            units.push({
              city: municipality.municipality,
              mayor: municipality.mayor,
              vice_mayor: municipality.vice_mayor,
              type: 'Municipality',
              province: province.province,
            });
          });
        }
      });
    }

    return units;
  }, [regionData]);

  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm) return allLocalGovUnits;

    return allLocalGovUnits.filter(unit => {
      const term = searchTerm.toLowerCase();
      return (
        (unit.city && unit.city.toLowerCase().includes(term)) ||
        (unit.mayor?.name && unit.mayor.name.toLowerCase().includes(term)) ||
        (unit.vice_mayor?.name &&
          unit.vice_mayor.name.toLowerCase().includes(term)) ||
        (unit.province && unit.province.toLowerCase().includes(term))
      );
    });
  }, [allLocalGovUnits, searchTerm]);

  const seoData = getLocalGovSEOData(regionData?.region);

  if (!regionData) {
    return (
      <>
        <SEO {...seoData} />
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <MapPinIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            Region not found
          </h3>
          <p className='text-gray-800'>
            The region you&apos;re looking for doesn&apos;t exist or may have
            been moved.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className='space-y-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {regionData.region}
            </h1>
            <p className='text-gray-800'>
              {allLocalGovUnits.length} cities and municipalities
            </p>
          </div>

          <div className='relative w-full md:w-64'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='search'
              placeholder='Search cities or officials...'
              className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredCities?.length === 0 ? (
          <div className='p-8 text-center bg-white rounded-lg border'>
            <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
              <SearchIcon className='h-6 w-6 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-1'>
              No cities found
            </h3>
            <p className='text-gray-800'>Try adjusting your search term.</p>
          </div>
        ) : (
          <CardGrid columns={2} breakpoint='lg' gap='md'>
            {filteredCities?.map((unit, index) => (
              <Card key={index}>
                <CardContent>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex-1'>
                      <CardTitle className='text-xl'>{unit.city}</CardTitle>
                      {unit.province ? (
                        <p className='text-sm text-gray-800 mt-1'>
                          {unit.province}
                        </p>
                      ) : (
                        <p className='text-sm text-gray-800 mt-1'>
                          Regional {unit.type}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          unit.type === 'City'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {unit.type}
                      </div>
                    </div>
                  </div>

                  {/* Mayor Section */}
                  <div className='mb-6'>
                    <div className='flex items-center mb-3'>
                      <CrownIcon className='h-4 w-4 text-yellow-600 mr-2' />
                      <span className='text-sm font-medium text-gray-700'>
                        Mayor
                      </span>
                    </div>

                    <div className='flex items-start space-x-3'>
                      <CardAvatar name={unit.mayor?.name || ''} size='sm' />
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 text-sm'>
                          {unit.mayor?.name || 'No Mayor Listed'}
                        </p>
                        <p className='text-xs text-gray-800'>Mayor</p>
                        {unit.mayor?.contact && (
                          <div className='mt-1'>
                            <CardContactInfo
                              contact={{ phone: unit.mayor.contact }}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vice Mayor Section */}
                  {unit.vice_mayor && (
                    <div>
                      <div className='flex items-center mb-3'>
                        <UserIcon className='h-4 w-4 text-blue-600 mr-2' />
                        <span className='text-sm font-medium text-gray-700'>
                          Vice Mayor
                        </span>
                      </div>

                      <div className='flex items-start space-x-3'>
                        <CardAvatar
                          name={unit.vice_mayor.name || ''}
                          size='sm'
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-gray-900 text-sm'>
                            {unit.vice_mayor.name}
                          </p>
                          <p className='text-xs text-gray-800'>Vice Mayor</p>
                          {unit.vice_mayor.contact && (
                            <div className='mt-1'>
                              <CardContactInfo
                                contact={{ phone: unit.vice_mayor.contact }}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardGrid>
        )}
      </div>
    </>
  );
}
