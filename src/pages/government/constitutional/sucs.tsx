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

// Filter SUCs from constitutional data
const sucs = institutionData.filter(
  office =>
    office.office_type.includes('State Universities') ||
    office.office_type.includes('SUCs')
);

export default function SUCsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter based on search term
  const filteredSUCs = sucs.filter(suc =>
    suc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            State Universities and Colleges
          </h1>
          <p className='text-gray-800 mt-1'>
            {sucs.length} SUCs in the directory
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search SUCs...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
        {filteredSUCs.length === 0 ? (
          <div className='col-span-full p-8 text-center bg-white rounded-lg border'>
            <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
              <Building2Icon className='h-6 w-6 text-gray-400' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-1'>
              No SUCs found
            </h3>
            <p className='text-gray-800'>Try adjusting your search term.</p>
          </div>
        ) : (
          filteredSUCs.map(suc => (
            <div
              key={suc.name}
              className='bg-white rounded-lg border overflow-hidden flex flex-col h-full'
            >
              <div className='p-4 border-b'>
                <h3 className='font-semibold text-lg text-gray-900 line-clamp-2'>
                  {suc.name}
                </h3>
              </div>

              <div className='p-4 space-y-3 flex-1'>
                {suc.address && (
                  <p className='text-sm text-gray-800 flex items-start'>
                    <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>{suc.address}</span>
                  </p>
                )}

                {(suc.phone ||
                  suc.trunk_line ||
                  (suc.trunklines && suc.trunklines[0])) && (
                  <p className='text-sm text-gray-800 flex items-start'>
                    <PhoneIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>
                      {suc.phone || suc.trunk_line || suc.trunklines?.[0]}
                    </span>
                  </p>
                )}

                {suc.email && (
                  <a
                    href={`mailto:${suc.email}`}
                    className='text-sm text-gray-800 flex items-start hover:text-primary-600'
                  >
                    <MailIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                    <span>{suc.email}</span>
                  </a>
                )}

                {suc.officials && suc.officials.length > 0 && (
                  <div className='pt-2 border-t border-gray-100'>
                    <h4 className='text-sm font-medium text-gray-700 mb-2'>
                      Key Officials
                    </h4>
                    <ul className='space-y-1'>
                      {suc.officials.slice(0, 2).map((official, index) => (
                        <li key={index} className='text-sm'>
                          <span className='text-gray-800'>
                            {official.role}:{' '}
                          </span>
                          <span className='font-medium'>{official.name}</span>
                        </li>
                      ))}
                      {suc.officials.length > 2 && (
                        <li className='text-xs text-gray-800'>
                          +{suc.officials.length - 2} more officials
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {suc.website && (
                <div className='px-4 py-3 bg-gray-50 border-t mt-auto'>
                  <a
                    href={
                      suc.website.startsWith('http')
                        ? suc.website
                        : `https://${suc.website}`
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
