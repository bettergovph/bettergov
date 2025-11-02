import {
  Building2Icon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
} from 'lucide-react';
import { useState } from 'react';
import { institutionData } from './data';

// Filter GOCCs from constitutional data
const goccs = institutionData.filter(
  office =>
    office.office_type.includes('Government-Owned') ||
    office.office_type.includes('GOCCs')
);

export default function GOCCsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter based on search term
  const filteredGOCCs = goccs.filter(gocc =>
    gocc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Government-Owned and Controlled Corporations
          </h1>
          <p className='text-gray-800 mt-1'>
            {goccs.length} GOCCs in the directory
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search GOCCs...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
        {filteredGOCCs.length === 0 ? (
          <div className='col-span-full p-8 text-center bg-white rounded-lg border'>
            <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
              <Building2Icon className='h-6 w-6 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-1'>
              No GOCCs found
            </h3>
            <p className='text-gray-800'>Try adjusting your search term.</p>
          </div>
        ) : (
          filteredGOCCs.map(gocc => (
            <div
              key={gocc.name}
              className='bg-white rounded-lg border overflow-hidden flex flex-col h-full'
            >
              <div className='p-4 border-b'>
                <h3 className='font-semibold text-lg text-gray-900 line-clamp-2'>
                  {gocc.name}
                </h3>
              </div>

              <div className='p-4 space-y-3 flex-1'>
                {gocc.address && (
                  <p className='text-sm text-gray-800 flex items-start'>
                    <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>{gocc.address}</span>
                  </p>
                )}

                {(gocc.phone ||
                  gocc.trunk_line ||
                  (gocc.trunklines && gocc.trunklines[0])) && (
                  <p className='text-sm text-gray-800 flex items-start'>
                    <PhoneIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>
                      {gocc.phone || gocc.trunk_line || gocc.trunklines?.[0]}
                    </span>
                  </p>
                )}

                {gocc.email && (
                  <a
                    href={`mailto:${gocc.email}`}
                    className='text-sm text-gray-800 flex items-start hover:text-primary-600'
                  >
                    <MailIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>{gocc.email}</span>
                  </a>
                )}

                {gocc.officials && gocc.officials.length > 0 && (
                  <div className='pt-2 border-t border-gray-100'>
                    <h4 className='text-sm font-medium text-gray-700 mb-2'>
                      Key Officials
                    </h4>
                    <ul className='space-y-1'>
                      {gocc.officials.slice(0, 2).map((official, index) => (
                        <li key={index} className='text-sm'>
                          <span className='text-gray-800'>
                            {official.role}:{' '}
                          </span>
                          <span className='font-medium'>{official.name}</span>
                        </li>
                      ))}
                      {gocc.officials.length > 2 && (
                        <li className='text-xs text-gray-800'>
                          +{gocc.officials.length - 2} more officials
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {gocc.website && (
                <div className='px-4 py-3 bg-gray-50 border-t mt-auto'>
                  <a
                    href={
                      gocc.website.startsWith('http')
                        ? gocc.website
                        : `https://${gocc.website}`
                    }
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-primary-600 hover:text-primary-700 flex items-center'
                  >
                    <span>Visit website</span>
                    <ExternalLinkIcon className='ml-1.5 h-3.5 w-3.5' />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
