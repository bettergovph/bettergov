import { useState, useMemo } from 'react';
import { SearchIcon, UsersIcon, PhoneIcon, MapPinIcon } from 'lucide-react';
import legislativeData from '../../../data/directory/legislative.json';
import {
  Card,
  CardHeader,
  CardContent,
  CardDivider,
} from '../../../components/ui/CardList';

interface HouseMember {
  province_city: string;
  name: string;
  district: string;
  contact: string;
}

export default function HouseMembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Get House of Representatives data
  const houseData = legislativeData.find((item: { chamber: string }) =>
    item.chamber.includes('House of Representatives')
  );

  // Extract house members
  const houseMembers = useMemo(
    () => houseData?.house_members || [],
    [houseData]
  );

  // Get unique provinces/cities for filtering
  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(houseMembers.map((member: HouseMember) => member.province_city))
    ).sort();
    return uniqueProvinces;
  }, [houseMembers]);

  // Filter members based on search term and selected province
  const filteredMembers = useMemo(() => {
    return houseMembers.filter((member: HouseMember) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.province_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.district.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProvince =
        !selectedProvince || member.province_city === selectedProvince;

      return matchesSearch && matchesProvince;
    });
  }, [houseMembers, searchTerm, selectedProvince]);

  return (
    <div className='@container space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            House Members by Cities/Provinces
          </h1>
          <p className='text-gray-800 mt-2'>
            {houseMembers.length} Representatives from {provinces.length}{' '}
            cities/provinces
          </p>
        </div>

        <div className='flex flex-col md:flex-row gap-3'>
          <div className='relative w-full md:w-72'>
            <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='search'
              placeholder='Search representatives...'
              className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className='rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-w-[200px]'
            value={selectedProvince || ''}
            onChange={e => setSelectedProvince(e.target.value || null)}
          >
            <option value=''>All Cities/Provinces</option>
            {provinces.map(province => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <UsersIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No representatives found
          </h3>
          <p className='text-gray-800'>
            Try adjusting your search term or filter.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
          {filteredMembers.map((member, index) => (
            <Card key={index} hover={false} className='h-full flex flex-col'>
              <CardHeader className='flex-none'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-base text-gray-900 leading-tight'>
                      {member.name}
                    </h3>
                    <div className='flex items-center gap-1.5 mt-2'>
                      <MapPinIcon className='h-3.5 w-3.5 text-gray-400 flex-shrink-0' />
                      <p className='text-sm text-gray-600'>
                        {member.province_city}
                      </p>
                    </div>
                    <p className='text-xs text-primary-600 font-medium mt-1'>
                      {member.district} District
                    </p>
                  </div>
                  <div className='rounded-full bg-primary-50 p-2 shrink-0'>
                    <UsersIcon className='h-5 w-5 text-primary-600' />
                  </div>
                </div>
              </CardHeader>
              <CardDivider />
              <CardContent className='flex-1'>
                <div className='flex items-start gap-2 text-sm'>
                  <PhoneIcon className='h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5' />
                  <span className='text-gray-700'>{member.contact}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
