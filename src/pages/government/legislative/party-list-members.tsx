import { useState, useMemo } from 'react';
import { Search, Users, MapPin, Phone } from 'lucide-react';
import legislativeData from '../../../data/directory/legislative.json';

interface PartyListMember {
  party_list: string;
  name: string;
  contact: string;
}

export default function PartyListMembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyList, setSelectedPartyList] = useState<string | null>(
    null
  );

  // Get Party List House of Representatives data
  const houseData = legislativeData.find((item: any) =>
    item.chamber.includes('House of Representatives')
  );

  // Extract party list members
  const partyListMembers = houseData?.party_list_representatives || [];

  // Get unique partylist for filtering
  const partyList = useMemo(() => {
    const uniquePartyList = Array.from(
      new Set(
        partyListMembers.map((member: PartyListMember) => member.party_list)
      )
    ).sort();
    return uniquePartyList;
  }, [partyListMembers]);

  // Filter members based on search term and selected party list
  const filteredMembers = useMemo(() => {
    return partyListMembers.filter((member: PartyListMember) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.party_list.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPartyList =
        !selectedPartyList || member.party_list === selectedPartyList;

      return matchesSearch && matchesPartyList;
    });
  }, [partyListMembers, searchTerm, selectedPartyList]);

  // Group members by party list
  const membersByPartyList = useMemo(() => {
    const grouped: Record<string, PartyListMember[]> = {};

    filteredMembers.forEach((member: PartyListMember) => {
      if (!grouped[member.party_list]) {
        grouped[member.party_list] = [];
      }
      grouped[member.party_list].push(member);
    });

    // Sort party list alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc: Record<string, PartyListMember[]>, partyList) => {
        acc[partyList] = grouped[partyList];
        return acc;
      }, {});
  }, [filteredMembers]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            House Members by Party List
          </h1>
          <p className='text-gray-800 mt-1'>
            {partyListMembers.length} Representatives from {partyList.length}{' '}
            Party List
          </p>
        </div>

        <div className='flex flex-col md:flex-row gap-3'>
          <div className='relative w-full md:w-64'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='search'
              placeholder='Search representatives...'
              className='pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className='rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            value={selectedPartyList || ''}
            onChange={e => setSelectedPartyList(e.target.value || null)}
          >
            <option value=''>All Party List</option>
            {partyList.map(pl => (
              <option key={pl} value={pl}>
                {pl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.keys(membersByPartyList).length === 0 ? (
        <div className='p-8 text-center bg-white rounded-lg border'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <Users className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No representatives found
          </h3>
          <p className='text-gray-800'>
            Try adjusting your search term or filter.
          </p>
        </div>
      ) : (
        <div className='space-y-6'>
          {Object.entries(membersByPartyList).map(([partylist, members]) => (
            <div
              key={partylist}
              className='bg-white rounded-lg border overflow-hidden'
            >
              <div className='bg-gray-50 px-4 py-3 border-b'>
                <h2 className='text-lg font-medium text-gray-900'>
                  {partylist}
                </h2>
                <p className='text-sm text-gray-800'>
                  {members.length}{' '}
                  {members.length === 1 ? 'representative' : 'representatives'}
                </p>
              </div>

              <div className='divide-y'>
                {members.map((member, index) => (
                  <div
                    key={index}
                    className='p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2'
                  >
                    <div>
                      <h3 className='font-medium text-gray-900'>
                        {member.name}
                      </h3>
                    </div>

                    <div className='flex items-center text-sm text-gray-800'>
                      <Phone className='h-4 w-4 text-gray-400 mr-2' />
                      <span>{member.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
