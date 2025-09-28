import { useState, useMemo } from 'react';
import { SearchIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RegionLGU } from '../../../lib/lgu';
// Eagerly import all per-region LGU JSON files and flatten into an array
const modules = import.meta.glob<{ default: RegionLGU }>(
  '../../../data/directory/lgu/*.json',
  { eager: true }
);
const lguData: RegionLGU[] = Object.values(modules).map(m => m.default);
import {
  CardGrid,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from '../../../components/ui/CardList';
import SEO from '../../../components/SEO';
import { getLocalGovSEOData } from '../../../utils/seo-data';

export default function LocalGovernmentIndex() {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique regions from LGU data
  const regions = useMemo(() => {
    return lguData.map((regionData: RegionLGU) => {
      let cityCount = 0;

      // Count direct cities (if any)
      if (regionData.cities) {
        cityCount += regionData.cities.length;
      }

      // Count direct municipalities (if any)
      if (regionData.municipalities) {
        cityCount += regionData.municipalities.length;
      }

      // Count cities and municipalities in provinces (if any)
      if (regionData.provinces) {
        cityCount += regionData.provinces.reduce(
          (
            total: number,
            province: { cities?: unknown[]; municipalities?: unknown[] }
          ) => {
            const cities = province.cities?.length || 0;
            const municipalities = province.municipalities?.length || 0;
            return total + cities + municipalities;
          },
          0
        );
      }

      return {
        name: regionData.region,
        slug: regionData.slug,
        cityCount,
        description: `Explore local government units in ${regionData.region}`,
      };
    });
  }, []);

  // Filter regions based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return regions;

    return regions.filter(region =>
      region.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [regions, searchTerm]);

  const seoData = getLocalGovSEOData();

  return (
    <>
      <SEO {...seoData} />
      <div className='@container space-y-6'>
        <div className='flex flex-col @lg:flex-row @lg:items-center @lg:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Local Government Units
            </h1>
            <p className='text-gray-800'>
              {regions.length} regions •{' '}
              {regions.reduce((total, region) => total + region.cityCount, 0)}{' '}
              cities and municipalities
            </p>
          </div>

          <div className='relative w-full lg:w-64'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='search'
              placeholder='Search regions...'
              className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredRegions.length === 0 ? (
          <div className='p-8 text-center bg-white rounded-lg border'>
            <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
              <MapPinIcon className='h-6 w-6 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-1'>
              No regions found
            </h3>
            <p className='text-gray-800'>Try adjusting your search term.</p>
          </div>
        ) : (
          <CardGrid columns={1} className='@lg:grid-cols-2 @3xl:grid-cols-3'>
            {filteredRegions.map(region => (
              <Link
                key={region.slug}
                to={`/government/local/${region.slug}`}
                className='block'
              >
                <Card hover>
                  <CardContent>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <CardTitle className='text-lg mb-2 line-clamp-2'>
                          {region.name}
                        </CardTitle>
                        <CardDescription>{region.description}</CardDescription>
                      </div>
                      <div className='ml-3 shrink-0'>
                        <div className='bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full'>
                          Region
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-100'>
                      <div className='flex items-center text-sm text-gray-800'>
                        <UsersIcon className='h-4 w-4 mr-1' />
                        <span>{region.cityCount} cities</span>
                      </div>
                      <div className='flex items-center text-sm text-primary-600'>
                        <span>View Details</span>
                        <MapPinIcon className='h-4 w-4 ml-1' />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardGrid>
        )}
      </div>
    </>
  );
}
