import { NavLink } from 'react-router-dom';
import { UsersIcon } from 'lucide-react';
import type { RegionLGU } from '../../../../lib/lgu';

// Eagerly import all per-region LGU JSON files and flatten into an array
const modules = import.meta.glob<{ default: RegionLGU }>(
  '../../../../data/directory/lgu/*.json',
  { eager: true }
);
const lguData: RegionLGU[] = Object.values(modules).map(m => m.default);

export default function LocalSidebar() {
  const regions = lguData.map(regionData => {
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
    };
  });

  return (
    <div className='w-full md:w-64 shrink-0'>
      <div className='sticky top-6 space-y-4'>
        <div className='border rounded-lg overflow-hidden bg-white'>
          <div className='max-h-[calc(100vh-200px)] overflow-y-auto'>
            <nav className='p-2 space-y-4 pt-4'>
              <div>
                <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
                  Regions
                </h3>
                <ul className='space-y-1'>
                  {regions.map(region => (
                    <li key={region.slug}>
                      <NavLink
                        title={region.name}
                        to={`/government/local/${region.slug}`}
                        state={{ scrollToContent: true }}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`
                        }
                      >
                        <div className='flex items-center justify-between w-full'>
                          <span className='truncate flex-1' title={region.name}>
                            {region.name}
                          </span>
                          <div className='flex items-center ml-2'>
                            <UsersIcon className='h-3 w-3 text-gray-400 mr-1' />
                            <span className='text-xs text-gray-800'>
                              {region.cityCount}
                            </span>
                          </div>
                        </div>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
