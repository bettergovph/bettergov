import { useState, useMemo } from 'react';
import { SearchIcon, GlobeIcon } from 'lucide-react';
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

export default function DiplomaticMissionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Get diplomatic missions data
  const missions = useMemo(() => {
    return diplomaticData['Diplomatic Mission'] || [];
  }, []);

  // Filter missions based on search term
  const filteredMissions = useMemo(() => {
    return missions.filter(
      mission =>
        mission.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.representative.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [missions, searchTerm]);

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Diplomatic Missions
          </h1>
          <p className='text-gray-800 mt-1'>
            {missions.length} diplomatic missions in the Philippines
          </p>
        </div>

        <div className='relative w-full md:w-64'>
          <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search missions...'
            className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredMissions.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <GlobeIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No diplomatic missions found
          </h3>
          <p className='text-gray-800'>Try adjusting your search term.</p>
        </div>
      ) : (
        <CardGrid columns={1} className='@xl:grid-cols-2 @2xl:grid-cols-3'>
          {filteredMissions
            .sort((a, b) => a.country.localeCompare(b.country))
            .map((mission, index) => (
              <Card key={index} className='h-full'>
                <CardContent className='h-full flex flex-col'>
                  <div className='flex items-center justify-between mb-2'>
                    <CardTitle className='text-lg'>{mission.country}</CardTitle>
                    <div className='bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full'>
                      Mission
                    </div>
                  </div>
                  <CardDivider className='mb-4' />
                  <div className='flex-1'>
                    <CardDescription className='mb-4 flex-1'>
                      {mission.office_name}
                    </CardDescription>

                    <CardContactInfo
                      contact={{
                        address: mission.address,
                        phone: mission.contact,
                        email: mission.email,
                        website: mission.website,
                      }}
                    />
                  </div>

                  <CardDivider className='mt-4 mb-4' />
                  <div>
                    <p className='font-medium text-gray-900'>
                      {mission.representative}
                    </p>
                    <p className='text-sm text-gray-800'>{mission.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </CardGrid>
      )}
    </div>
  );
}
