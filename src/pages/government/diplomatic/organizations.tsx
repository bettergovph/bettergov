import { useState, useMemo, useEffect } from 'react';
import { SearchIcon, LandmarkIcon } from 'lucide-react';
import { fetchDiplomatic } from '../../../lib/cms-data';
import {
  CardGrid,
  Card,
  CardContent,
  CardTitle,
  CardContactInfo,
  CardDivider,
} from '../../../components/ui/CardList';

export default function InternationalOrganizationsPage() {
  const [diplomaticData, setDiplomaticData] = useState<Record<
    string,
    unknown[]
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDiplomatic()
      .then(data => {
        setDiplomaticData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Get international organizations data
  const organizations = useMemo(() => {
    return diplomaticData?.['International Organization'] || [];
  }, [diplomaticData]);

  // Filter organizations based on search term
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(
      org =>
        org.organization_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        org.head.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [organizations, searchTerm]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8 text-center bg-white rounded-lg border border-red-200'>
        <h3 className='text-lg font-medium text-red-900 mb-1'>
          Error loading data
        </h3>
        <p className='text-red-700'>{error.message}</p>
      </div>
    );
  }

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            International Organizations
          </h1>
          <p className='text-gray-800 mt-1'>
            {organizations.length} international organizations in the
            Philippines
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search organizations...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredOrganizations.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <LandmarkIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No organizations found
          </h3>
          <p className='text-gray-800'>Try adjusting your search term.</p>
        </div>
      ) : (
        <CardGrid columns={1} className='@xl:grid-cols-2 @2xl:grid-cols-3'>
          {filteredOrganizations.map((org, index) => (
            <Card key={index} className='h-full'>
              <CardContent className='h-full flex flex-col'>
                <div className='flex items-center justify-between mb-2'>
                  <CardTitle className='text-lg'>
                    {org.organization_name}
                  </CardTitle>
                  <div className='bg-purple-50 text-purple-700 text-xs font-medium px-2 py-1 rounded-full'>
                    Organization
                  </div>
                </div>

                <CardDivider className='my-1' />

                <div className='mt-4 flex-1'>
                  <CardContactInfo
                    contact={{
                      address: org.address,
                      phone: org.contact,
                      email: org.email,
                      website: org.website,
                    }}
                  />
                </div>

                <CardDivider className='mt-4 mb-4' />
                <div>
                  <p className='font-medium text-gray-900'>{org.head}</p>
                  <p className='text-sm text-gray-800'>{org.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
