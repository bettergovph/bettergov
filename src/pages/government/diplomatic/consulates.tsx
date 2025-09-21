import { useState, useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import diplomaticData from '../../../data/directory/diplomatic.json';
import {
  CardGrid,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardContactInfo,
  CardDivider,
} from '../../../components/ui/CardList';

export default function ConsulatesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Get consulates data
  const consulates = useMemo(() => {
    return diplomaticData['Consulate'] || [];
  }, []);

  // Filter consulates based on search term
  const filteredConsulates = useMemo(() => {
    return consulates.filter(
      consulate =>
        consulate.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consulate.office_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        consulate.representative
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [consulates, searchTerm]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Consulates</h1>
          <p className='text-gray-800 mt-1'>
            {consulates.length} consulates in the Philippines
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search consulates...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredConsulates.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <Building2 className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No consulates found
          </h3>
          <p className='text-gray-800'>Try adjusting your search term.</p>
        </div>
      ) : (
        <CardGrid columns={3} breakpoint='lg' gap='md'>
          {filteredConsulates.map((consulate, index) => (
            <Card key={index}>
              <CardContent>
                <div className='flex items-center justify-between mb-2'>
                  <CardTitle className='text-lg'>
                    {consulate.country || 'N/A'}
                  </CardTitle>
                  <div className='bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full'>
                    Consulate
                  </div>
                </div>

                <CardDivider className='my-4' />
                <CardDescription className='mb-4'>
                  {consulate.office_name}
                </CardDescription>

                <CardContactInfo
                  contact={{
                    address: consulate.address,
                    phone: consulate.contact,
                    email: consulate.email,
                    website: consulate.website,
                  }}
                />

                <CardDivider className='mt-4 mb-4' />
                <div>
                  <p className='font-medium text-gray-900'>
                    {consulate.representative}
                  </p>
                  <p className='text-sm text-gray-800'>{consulate.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
