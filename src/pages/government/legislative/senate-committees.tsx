import { useState, useMemo } from 'react';
import { SearchIcon, BookOpenIcon } from 'lucide-react';
import legislativeData from '../../../data/directory/legislative.json';

interface Committee {
  committee: string;
  chairperson: string;
}

export default function SenateCommitteesPage() {
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Senate Committees
          </h1>
          <p className='text-gray-800 mt-1'>
            {committees.length} permanent committees
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search committees...'
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {filteredCommittees.map((committee: Committee, index) => (
            <div
              key={index}
              className='bg-white rounded-lg border overflow-hidden'
            >
              <div className='p-4'>
                <h3 className='font-medium text-gray-900 mb-2'>
                  {committee.committee}
                </h3>
                <div className='flex items-start'>
                  <div className='bg-primary-50 text-primary-700 text-xs font-medium px-2 py-1 rounded-md'>
                    Chairperson
                  </div>
                  <p className='ml-2 text-sm text-gray-700'>
                    {committee.chairperson}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
