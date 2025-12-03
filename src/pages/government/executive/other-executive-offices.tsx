import { SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Card,
  CardContactInfo,
  CardContent,
  CardDivider,
  CardGrid,
  CardTitle,
} from '../../../components/ui/CardList';
import { executiveData } from './data';

const otherOffices = executiveData.filter(
  office =>
    !office.office.includes('OFFICE OF THE PRESIDENT') &&
    !office.office.includes('OFFICE OF THE VICE PRESIDENT') &&
    !office.office.toLowerCase().includes('communication')
);

export default function OtherExecutiveOfficesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm) return otherOffices;

    return otherOffices.filter(
      office =>
        office.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
        office.officials?.some(official => {
          if ('name' in official) {
            return (
              official.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              official.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
          } else if ('office_division' in official) {
            return (
              official.office_division
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              official.personnel.some(
                person =>
                  person.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  person.role.toLowerCase().includes(searchTerm.toLowerCase())
              )
            );
          }
          return false;
        })
    );
  }, [searchTerm]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Other Executive Offices
          </h1>
          <p className='text-gray-800 mt-1'>
            {filteredOffices.length} executive offices
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search offices or officials...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredOffices.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <SearchIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No offices found
          </h3>
          <p className='text-gray-800'>Try adjusting your search term.</p>
        </div>
      ) : (
        <CardGrid columns={2} breakpoint='lg' gap='lg'>
          {filteredOffices.map((office, index) => (
            <Card key={index}>
              <CardContent>
                <CardTitle level='h3' className='mb-2'>
                  {office.office}
                </CardTitle>
                <CardDivider className='mb-3' />

                <CardContactInfo
                  contact={{
                    address: office.address,
                    phone: office.trunkline,
                    email: office.email,
                    website: office.website,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
