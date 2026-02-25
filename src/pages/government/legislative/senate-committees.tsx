import { useState, useMemo, useEffect } from 'react';
import { SearchIcon, BookOpenIcon, UsersIcon } from 'lucide-react';
import { fetchLegislative } from '../../../lib/cms-data';
import { Card, CardHeader, CardContent } from '../../../components/ui/CardList';

interface Committee {
  committee: string;
  chairperson: string;
}

export default function SenateCommitteesPage() {
  const [legislativeData, setLegislativeData] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLegislative()
      .then(data => {
        setLegislativeData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // Get Senate data
  const senateData = legislativeData.find((item: { chamber: string }) =>
    item.chamber.includes('Senate')
  );

  // Extract committees
  const committees = useMemo(
    () => senateData?.permanent_committees || [],
    [senateData]
  );

  // Filter committees based on search term
  const filteredCommittees = useMemo(() => {
    return committees.filter(
      (committee: Committee) =>
        committee.committee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        committee.chairperson.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [committees, searchTerm]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading senate committees...</p>
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
          <h1 className='text-3xl font-bold text-gray-900'>
            Senate Committees
          </h1>
          <p className='text-gray-800 mt-2'>
            {committees.length} permanent committees in the Senate
          </p>
        </div>

        <div className='relative w-full md:w-72'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search committees or chairpersons...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredCommittees.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <BookOpenIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No committees found
          </h3>
          <p className='text-gray-800'>Try adjusting your search term.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-6'>
          {filteredCommittees.map((committee: Committee, index) => (
            <Card key={index} hover={true} className='h-full flex flex-col'>
              <CardHeader className='flex-none'>
                <h3 className='font-semibold text-base text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]'>
                  {committee.committee}
                </h3>
              </CardHeader>
              <CardContent className='flex-1 flex flex-col justify-between'>
                <div className='flex items-center gap-2 text-sm'>
                  <UsersIcon className='h-4 w-4 text-gray-400 flex-shrink-0' />
                  <div className='flex flex-col'>
                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                      Chairperson
                    </span>
                    <span className='font-medium text-gray-900 mt-0.5'>
                      {committee.chairperson}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
