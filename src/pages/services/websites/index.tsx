import {
  ArrowUpDownIcon,
  ExternalLinkIcon,
  FilterIcon,
  GlobeIcon,
  SearchIcon,
} from 'lucide-react';
import { ChangeEvent, FC, useMemo, useState } from 'react';
import Button from '../../../components/ui/Button';
import websitesData from '../../../data/websites.json';

interface Website {
  name: string;
  slug: string;
  email: string | string[] | null;
  website: string | null;
  address: string | null;
  contact: string | null;
  type: string;
}

const WebsitesDirectory: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Extract unique types for filtering
  const websiteTypes = useMemo(() => {
    const types = new Set<string>();
    websitesData.forEach((website: Website) => {
      if (website.type) types.add(website.type);
    });
    return Array.from(types).sort();
  }, []);

  // Filter and sort websites
  const filteredWebsites = useMemo(() => {
    return websitesData
      .filter((website: Website) => {
        const matchesSearch =
          website.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (website.website &&
            website.website.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType =
          selectedType === '' || website.type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a: Website, b: Website) => {
        if (sortBy === 'name') {
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else {
          // Sort by type then by name
          const typeComparison =
            sortDirection === 'asc'
              ? a.type.localeCompare(b.type)
              : b.type.localeCompare(a.type);

          return typeComparison !== 0
            ? typeComparison
            : a.name.localeCompare(b.name);
        }
      });
  }, [searchQuery, selectedType, sortBy, sortDirection]);

  // Format website URL
  const formatUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://${url}`;
  };

  // Toggle sort direction
  const toggleSort = (field: 'name' | 'type') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* <SEO
        title="Government Websites Directory | BetterGov.ph"
        description="Comprehensive directory of Philippine government websites, agencies, and services."
        keywords="philippines government websites, philippine agencies online, government directory"
      /> */}

      <div className='bg-linear-to-r from-primary-700 to-primary-900 text-white py-16'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center mb-4'>
            <GlobeIcon className='h-8 w-8 mr-3' />
            <h1 className='text-3xl md:text-4xl font-bold'>
              Government Websites Directory
            </h1>
          </div>
          <p className='text-lg md:text-xl opacity-90 max-w-3xl'>
            Access official websites of Philippine government agencies, local
            government units, and other public institutions.
          </p>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        {/* Search and Filter Section */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='col-span-1 md:col-span-2'>
              <div className='relative'>
                <SearchIcon
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={18}
                />
                <input
                  type='text'
                  placeholder='Search by name or website...'
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className='pl-10 w-full'
                />
              </div>
            </div>
            <div>
              <div className='relative'>
                <FilterIcon
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={18}
                />
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className='pl-10 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500'
                >
                  <option value=''>All Categories</option>
                  {websiteTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center'>
            <div className='text-sm text-gray-800'>
              Showing {filteredWebsites.length} of {websitesData.length}{' '}
              websites
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => toggleSort('name')}
                className='flex items-center text-sm'
              >
                Sort by Name
                {sortBy === 'name' && (
                  <ArrowUpDownIcon className='ml-1 h-4 w-4' />
                )}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => toggleSort('type')}
                className='flex items-center text-sm'
              >
                Sort by Category
                {sortBy === 'type' && (
                  <ArrowUpDownIcon className='ml-1 h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          <div className='divide-y divide-gray-200'>
            {filteredWebsites.length > 0 ? (
              filteredWebsites.map((website: Website, index: number) => (
                <div
                  key={`${website.slug}-${index}`}
                  className='p-6 hover:bg-gray-50 transition-colors'
                >
                  <div className='flex flex-col md:flex-row md:justify-between md:items-start gap-4'>
                    <div className='flex-1'>
                      <div className='flex items-center'>
                        <h2 className='text-lg font-semibold text-gray-900'>
                          {website.name}
                        </h2>
                        {/* <span className="ml-3 capitalize text-xs bg-green-100 rounded-full px-2 py-1">
                          {website.type}
                        </span> */}
                      </div>

                      {website.address && (
                        <p className='text-gray-800 mt-1 text-sm'>
                          {website.address}
                        </p>
                      )}
                      {website.website && (
                        <div className='mt-2'>
                          <span className='text-sm font-medium text-gray-800'>
                            Website:{' '}
                          </span>
                          <a
                            href={formatUrl(website.website) as string}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-sm text-primary-600'
                          >
                            {website.website}
                          </a>
                        </div>
                      )}

                      {website.email && (
                        <div className='mt-2'>
                          <span className='text-sm font-medium text-gray-800'>
                            Email:{' '}
                          </span>
                          <span className='text-sm text-primary-600'>
                            {Array.isArray(website.email)
                              ? website.email.join(', ')
                              : website.email}
                          </span>
                        </div>
                      )}

                      {website.contact && (
                        <div className='mt-1'>
                          <span className='text-sm font-medium text-gray-800'>
                            Contact:{' '}
                          </span>
                          <span className='text-sm text-gray-800'>
                            {Array.isArray(website.contact)
                              ? website.contact.join(', ')
                              : website.contact}
                          </span>
                        </div>
                      )}
                    </div>

                    {website.website && (
                      <div className='shrink-0'>
                        <a
                          href={formatUrl(website.website) as string}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-xs text-white bg-primary-600 hover:bg-primary-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                        >
                          Visit Website
                          <ExternalLinkIcon className='ml-2 h-4 w-4' />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className='p-8 text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4'>
                  <SearchIcon className='h-8 w-8 text-gray-400' />
                </div>
                <h3 className='text-lg font-medium text-gray-900'>
                  No websites found
                </h3>
                <p className='mt-1 text-gray-800'>
                  Try adjusting your search or filter to find what you&apos;re
                  looking for.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className='mt-8 bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-xl font-bold mb-4 text-gray-800'>
            About This Directory
          </h2>
          <p className='text-gray-800 mb-4'>
            This comprehensive directory provides access to official websites of
            various Philippine government institutions, agencies, and local
            government units. The information is regularly updated to ensure
            accuracy and reliability.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Categories
              </h3>
              <p className='text-gray-800'>
                Websites are categorized by type of institution (executive,
                judicial, legislative, constitutional, diplomatic, and local
                government units) to help you find the right government service
                quickly.
              </p>
            </div>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Reporting Issues
              </h3>
              <p className='text-gray-800'>
                If you find any broken links, outdated information, or have
                suggestions for improvement, please contact us through our
                feedback form or email at
                <a
                  href='mailto:info@bettergov.ph'
                  className='text-primary-600 hover:underline ml-1'
                >
                  info@bettergov.ph
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsitesDirectory;
