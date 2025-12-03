import { useParams } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeIcon,
  Mail,
  UserIcon,
  UsersIcon,
  CrownIcon,
  ShieldIcon,
} from 'lucide-react';

import legislativeData from '../../../data/directory/legislative.json';
import { cn } from '../../../lib/utils';
import {
  Card,
  CardHeader,
  CardContent,
  CardDivider,
} from '../../../components/ui/CardList';

// Component to render officials in a card grid
function OfficialsGrid({
  officials,
}: {
  officials: Array<{
    role: string;
    name: string;
    contact?: string;
    office?: string;
  }>;
}) {
  return (
    <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
      {officials.map((official, index) => (
        <Card key={index} hover={false} className='h-full flex flex-col'>
          <CardHeader className='flex-none min-h-[100px]'>
            <div className='flex items-start justify-between gap-3 h-full'>
              <div className='flex-1'>
                <h3 className='font-semibold text-base text-gray-900 leading-tight'>
                  {official.name}
                </h3>
                <p className='text-sm text-primary-600 font-medium mt-1'>
                  {official.role}
                </p>
                {official.office && (
                  <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
                    {official.office}
                  </p>
                )}
              </div>
              <div className='rounded-full bg-gray-100 p-2 shrink-0'>
                <UserIcon className='h-5 w-5 text-gray-600' />
              </div>
            </div>
          </CardHeader>
          <CardDivider />
          <CardContent className='flex-1 flex items-start'>
            {official.contact && official.contact !== '__' ? (
              <div className='flex items-start gap-2 text-sm w-full'>
                <PhoneIcon className='h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5' />
                <span className='text-gray-700'>{official.contact}</span>
              </div>
            ) : (
              <span className='text-sm text-gray-400 italic'>
                No contact available
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Component to render committees in a card grid
function CommitteesGrid({
  committees,
}: {
  committees: Array<{ committee: string; chairperson?: string; name?: string }>;
}) {
  return (
    <div className='grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-6'>
      {committees.map((committee, index) => (
        <Card key={index} hover={false} className='h-full flex flex-col'>
          <CardHeader className='flex-none'>
            <h3 className='font-semibold text-base text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]'>
              {committee.committee}
            </h3>
          </CardHeader>
          <CardDivider />
          <CardContent className='flex-1 flex flex-col justify-between'>
            <div className='flex items-center gap-2 text-sm'>
              <UsersIcon className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <div className='flex flex-col'>
                <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                  Chairperson
                </span>
                <span className='font-medium text-gray-900 mt-0.5'>
                  {committee.chairperson || committee.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Component to render house leaders
interface HouseLeader {
  name: string;
  contact?: { contact?: string };
}

interface HouseLeadersData {
  speaker?: HouseLeader;
  deputy_speakers?: HouseLeader[];
  majority_floor_leader?: HouseLeader;
  senior_deputy_majority_floor_leader?: HouseLeader;
  minority_floor_leader?: HouseLeader;
  senior_deputy_minority_floor_leader?: HouseLeader;
}

interface LeaderCard {
  name: string;
  role: string;
  contact?: string;
  icon: typeof CrownIcon | typeof ShieldIcon | typeof UserIcon;
  isPrimary: boolean;
}

function HouseLeadersGrid({ leaders }: { leaders: HouseLeadersData }) {
  const leaderCards: LeaderCard[] = [];

  // Speaker
  if (leaders.speaker) {
    leaderCards.push({
      name: leaders.speaker.name,
      role: 'Speaker of the House',
      contact: leaders.speaker.contact?.contact,
      icon: CrownIcon,
      isPrimary: true,
    });
  }

  // Deputy Speakers
  if (leaders.deputy_speakers && Array.isArray(leaders.deputy_speakers)) {
    leaders.deputy_speakers.forEach((deputy: HouseLeader) => {
      leaderCards.push({
        name: deputy.name,
        role: 'Deputy Speaker',
        contact: deputy.contact?.contact,
        icon: ShieldIcon,
        isPrimary: false,
      });
    });
  }

  // Majority Floor Leader
  if (leaders.majority_floor_leader) {
    leaderCards.push({
      name: leaders.majority_floor_leader.name,
      role: 'Majority Floor Leader',
      contact: leaders.majority_floor_leader.contact?.contact,
      icon: UserIcon,
      isPrimary: false,
    });
  }

  // Senior Deputy Majority Floor Leader
  if (leaders.senior_deputy_majority_floor_leader) {
    leaderCards.push({
      name: leaders.senior_deputy_majority_floor_leader.name,
      role: 'Senior Deputy Majority Floor Leader',
      contact: leaders.senior_deputy_majority_floor_leader.contact?.contact,
      icon: UserIcon,
      isPrimary: false,
    });
  }

  // Minority Floor Leader
  if (leaders.minority_floor_leader) {
    leaderCards.push({
      name: leaders.minority_floor_leader.name,
      role: 'Minority Floor Leader',
      contact: leaders.minority_floor_leader.contact?.contact,
      icon: UserIcon,
      isPrimary: false,
    });
  }

  // Senior Deputy Minority Floor Leader
  if (leaders.senior_deputy_minority_floor_leader) {
    leaderCards.push({
      name: leaders.senior_deputy_minority_floor_leader.name,
      role: 'Senior Deputy Minority Floor Leader',
      contact: leaders.senior_deputy_minority_floor_leader.contact?.contact,
      icon: UserIcon,
      isPrimary: false,
    });
  }

  return (
    <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
      {leaderCards.map((leader, index) => {
        const IconComponent = leader.icon;
        return (
          <Card key={index} hover={false} className='h-full flex flex-col'>
            <CardHeader className='flex-none min-h-[90px]'>
              <div className='flex items-start justify-between gap-3 h-full'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-base text-gray-900 leading-tight'>
                    {leader.name}
                  </h3>
                  <p
                    className={`text-sm font-medium mt-1 ${
                      leader.isPrimary ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  >
                    {leader.role}
                  </p>
                </div>
                <div
                  className={`rounded-full p-2 shrink-0 ${
                    leader.isPrimary ? 'bg-primary-100' : 'bg-gray-100'
                  }`}
                >
                  <IconComponent
                    className={`h-5 w-5 ${
                      leader.isPrimary ? 'text-primary-600' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardDivider />
            <CardContent className='flex-1 flex items-start'>
              {leader.contact ? (
                <div className='flex items-start gap-2 text-sm w-full'>
                  <PhoneIcon className='h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5' />
                  <span className='text-gray-700'>{leader.contact}</span>
                </div>
              ) : (
                <span className='text-sm text-gray-400 italic'>
                  No contact available
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Recursive component to render legislative details
function LegislativeDetailSection({
  data,
  level = 0,
  sectionKey = '',
}: {
  data: unknown;
  level?: number;
  sectionKey?: string;
}) {
  if (data === null || typeof data !== 'object') {
    return <span className='text-gray-700'>{String(data)}</span>;
  }

  // Special handling for officials array
  if (Array.isArray(data) && sectionKey === 'officials') {
    return (
      <OfficialsGrid
        officials={
          data as Array<{
            role: string;
            name: string;
            contact?: string;
            office?: string;
          }>
        }
      />
    );
  }

  // Special handling for secretariat officials
  if (Array.isArray(data) && sectionKey === 'secretariat_officials') {
    return (
      <OfficialsGrid
        officials={
          data as Array<{
            role: string;
            name: string;
            contact?: string;
            office?: string;
          }>
        }
      />
    );
  }

  // Special handling for permanent committees
  if (Array.isArray(data) && sectionKey === 'permanent_committees') {
    return (
      <CommitteesGrid
        committees={data as Array<{ committee: string; chairperson: string }>}
      />
    );
  }

  // Special handling for special committees
  if (Array.isArray(data) && sectionKey === 'special_committees') {
    return (
      <CommitteesGrid
        committees={data as Array<{ committee: string; chairperson: string }>}
      />
    );
  }

  // Special handling for house committees (with nested chairpersons)
  if (
    typeof data === 'object' &&
    data !== null &&
    sectionKey === 'house_committees'
  ) {
    const houseCommittees = data as {
      chairpersons?: Array<{ committee: string; name: string }>;
    };
    if (
      houseCommittees.chairpersons &&
      Array.isArray(houseCommittees.chairpersons)
    ) {
      return <CommitteesGrid committees={houseCommittees.chairpersons} />;
    }
  }

  // Special handling for house leaders
  if (
    typeof data === 'object' &&
    data !== null &&
    sectionKey === 'house_leaders'
  ) {
    return <HouseLeadersGrid leaders={data} />;
  }

  if (Array.isArray(data)) {
    return (
      <div className='space-y-2'>
        {data.map((item, index) => (
          <div
            key={index}
            className={`${
              level > 0
                ? 'ml-4 border-l border-b border-neutral-100 pl-3 py-2'
                : ''
            }`}
          >
            <LegislativeDetailSection
              data={item}
              level={level + 1}
              sectionKey={sectionKey}
            />
          </div>
        ))}
      </div>
    );
  }

  // Check if this is a simple key-value object with no nested objects
  const isSimpleObject = Object.values(data).every(
    value => value === null || typeof value !== 'object'
  );

  // Skip these keys as they're displayed in the header or have dedicated pages
  const skipKeys = [
    'slug',
    'branch',
    'chamber',
    'address',
    'trunkline',
    'website',
    'house_members',
    'party_list_representatives',
  ];

  if (isSimpleObject) {
    return (
      <div
        className={cn(
          'mb-4 grid grid-cols-1 @sm:grid-cols-2 gap-x-6 gap-y-3 max-w-3xl',
          level === 1 && 'rounded-2xl font-bold text-lg'
        )}
      >
        {Object.entries(data).map(([key, value]) => {
          if (skipKeys.includes(key) || value === undefined) return null;

          // Special rendering for email so it's visible and wraps cleanly
          if (key === 'email' && value) {
            return (
              <div key={key} className='text-sm'>
                <div className='flex items-start'>
                  <Mail
                    className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0'
                    aria-hidden='true'
                  />
                  <a
                    href={`mailto:${value}`}
                    className='text-primary-600 hover:underline leading-relaxed break-all'
                  >
                    <span className='sr-only'>Email</span>
                    {String(value)}
                  </a>
                </div>
              </div>
            );
          }

          return (
            <div key={key} className='text-sm'>
              <span className='text-gray-800 leading-relaxed'>
                {String(value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  const entries = Object.entries(data).filter(
    ([key]) => !skipKeys.includes(key)
  );

  if (entries.length === 0) return null;

  return (
    <div className='@container space-y-6'>
      {entries.map(([key, value]) => {
        if (value === undefined || value === null) return null;

        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const isArray = Array.isArray(value);

        return (
          <div key={key} className='pb-4'>
            <div className='flex items-center mb-3 align-middle gap-2'>
              <h2 className='text-2xl font-bold text-gray-900'>{label}</h2>
              {isArray && (
                <div className='text-sm text-primary-600 font-medium bg-primary-50 px-2.5 py-1 rounded-md'>
                  {Array.isArray(value) ? value.length : 0}
                </div>
              )}
            </div>
            <div className='mt-4'>
              <LegislativeDetailSection
                data={value}
                level={level + 1}
                sectionKey={key}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LegislativeChamber() {
  const { chamber } = useParams<{ chamber: string }>();

  const chamberData = legislativeData.find(
    (item: { slug: string }) => item.slug === chamber
  );

  if (!chamberData) {
    return (
      <div className='bg-white rounded-lg p-6 shadow-xs'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          Chamber Not Found
        </h1>
        <p className='text-gray-800'>
          The requested legislative chamber could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900 mb-3'>
          {chamberData.chamber}
        </h1>

        <div className='flex flex-col space-y-2 text-sm'>
          {chamberData.address && (
            <div className='flex items-start'>
              <MapPinIcon className='h-5 w-5 text-gray-400 mr-2 mt-0.5' />
              <span className='text-gray-800'>{chamberData.address}</span>
            </div>
          )}

          {chamberData.trunkline && (
            <div className='flex items-start'>
              <PhoneIcon className='h-5 w-5 text-gray-400 mr-2 mt-0.5' />
              <span className='text-gray-800'>{chamberData.trunkline}</span>
            </div>
          )}

          {chamberData.website && (
            <div className='flex items-start'>
              <GlobeIcon className='h-5 w-5 text-gray-400 mr-2 mt-0.5' />
              <a
                href={
                  chamberData.website.startsWith('http')
                    ? chamberData.website
                    : `https://${chamberData.website}`
                }
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:underline flex items-center'
              >
                <span>{chamberData.website}</span>
                <ExternalLinkIcon className='ml-1 h-3.5 w-3.5' />
              </a>
            </div>
          )}
        </div>
      </div>

      <LegislativeDetailSection data={chamberData} />
    </div>
  );
}
