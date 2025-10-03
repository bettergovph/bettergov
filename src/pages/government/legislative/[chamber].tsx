import { useParams } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeIcon,
  Mail,
  UserIcon,
  UsersIcon,
} from 'lucide-react';

import legislativeData from '../../../data/directory/legislative.json';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardContent } from '../../../components/ui/CardList';

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
          <CardHeader className='flex-none'>
            <div className='flex items-start justify-between gap-3'>
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
          {official.contact && official.contact !== '__' && (
            <CardContent className='flex-1'>
              <div className='flex items-start gap-2 text-sm'>
                <PhoneIcon className='h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5' />
                <span className='text-gray-700'>{official.contact}</span>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

// Component to render committees in a card grid
function CommitteesGrid({
  committees,
}: {
  committees: Array<{ committee: string; chairperson: string }>;
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

  if (Array.isArray(data)) {
    return (
      <div className='space-y-2'>
        {data.map((item, index) => (
          <div
            key={index}
            className={`${
              level > 0 ? 'ml-4 border-l border-b border-neutral-100 pl-3' : ''
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

  // Skip these keys as they're displayed in the header
  const skipKeys = [
    'slug',
    'branch',
    'chamber',
    'address',
    'trunkline',
    'website',
  ];

  if (isSimpleObject) {
    return (
      <div
        className={cn(
          'mb-4 grid grid-cols-1 @sm:grid-cols-2 gap-x-6 max-w-3xl',
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
      <div className='bg-white rounded-lg  shadow-xs'>
        <div className=''>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            {chamberData.chamber}
          </h1>

          <div className='flex flex-col space-y-2 text-sm pb-4'>
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
      </div>

      <LegislativeDetailSection data={chamberData} />
    </div>
  );
}
