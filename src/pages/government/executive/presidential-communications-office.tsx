import { SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Card,
  CardAvatar,
  CardContactInfo,
  CardContent,
  CardDescription,
  CardDivider,
  CardGrid,
  CardList,
  CardTitle,
} from '../../../components/ui/CardList';
import { executiveData } from './data';

const communicationsOffices = executiveData.filter(office =>
  office.office.toLowerCase().includes('communication')
);

export default function PresidentialCommunicationsOfficePage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm) return communicationsOffices;

    return communicationsOffices.filter(
      office =>
        office.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (office.officials &&
          office.officials.some(official => {
            if ('name' in official) {
              return (
                official.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
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
          }))
    );
  }, [searchTerm]);

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Presidential Communications Offices
          </h1>
          <p className='text-gray-800 mt-1'>
            {filteredOffices.length} communications-related offices
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
        <CardList>
          {filteredOffices.map((office, index) => (
            <div key={index} className='space-y-6'>
              <Card>
                <CardContent>
                  <CardTitle level='h2' className='text-xl mb-4'>
                    {office.office}
                  </CardTitle>
                  <CardContactInfo
                    contact={{
                      address: office.address,
                      phone: office.trunkline,
                      website: office.website,
                    }}
                  />
                </CardContent>
              </Card>

              {office.officials &&
                office.officials.find(
                  official =>
                    'name' in official &&
                    (official.role.includes('Secretary') ||
                      official.role.includes('Acting Secretary'))
                ) && (
                  <Card variant='featured'>
                    <CardContent>
                      {office.officials
                        .filter(
                          official =>
                            'name' in official &&
                            (official.role.includes('Secretary') ||
                              official.role.includes('Acting Secretary'))
                        )
                        .map((official, officialIndex) => {
                          if (!('name' in official)) return null;
                          return (
                            <div
                              key={officialIndex}
                              className='flex flex-col items-center text-center'
                            >
                              <CardAvatar
                                name={official.name}
                                size='lg'
                                className='mb-4'
                              />
                              <CardTitle level='h2' className='text-xl'>
                                {official.name}
                              </CardTitle>
                              <CardDescription className='text-primary-600 font-medium text-base'>
                                {official.role}
                              </CardDescription>
                              <div className='mt-3'>
                                <CardContactInfo
                                  contact={{
                                    phone: official.contact,
                                    email: official.email,
                                  }}
                                  compact
                                />
                              </div>
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}

              {office.officials && (
                <CardGrid columns={1} className='@lg:grid-cols-2'>
                  {office.officials
                    .filter(item => 'office_division' in item)
                    .map((division, idx) => {
                      if (!('office_division' in division)) return null;
                      return (
                        <Card key={idx}>
                          <CardContent>
                            <CardTitle className='mb-3 capitalize'>
                              {division.office_division}
                            </CardTitle>
                            <CardDivider className='mb-3' />

                            <div className='space-y-4'>
                              {division.personnel.map((person, personIdx) => (
                                <div
                                  key={personIdx}
                                  className='border-b border-gray-100 pb-3 last:border-0 last:pb-0'
                                >
                                  <p className='font-medium text-gray-800'>
                                    {person.name}
                                  </p>
                                  <p className='text-sm text-gray-800'>
                                    {person.role}
                                  </p>

                                  <div className='mt-2'>
                                    <CardContactInfo
                                      contact={{
                                        phone: person.contact,
                                        email: person.email,
                                      }}
                                      compact
                                    />

                                    {person.other_office && (
                                      <div className='mt-1'>
                                        <span className='text-xs text-gray-800 italic'>
                                          {person.other_office}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </CardGrid>
              )}
            </div>
          ))}
        </CardList>
      )}
    </div>
  );
}
