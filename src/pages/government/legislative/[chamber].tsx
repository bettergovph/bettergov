import { useParams } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeIcon,
  Mail,
} from 'lucide-react';

import legislativeData from '../../../data/directory/legislative.json';
import { cn } from '../../../lib/utils';

// Recursive component to render legislative details
function LegislativeDetailSection({
  data,
  level = 0,
}: {
  data: unknown;
  level?: number;
}) {
  if (data === null || typeof data !== 'object') {
    return <span className='text-gray-700'>{String(data)}</span>;
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
            <LegislativeDetailSection data={item} level={level + 1} />
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
    <div className='@container space-y-4'>
      {entries.map(([key, value]) => {
        if (value === undefined || value === null) return null;

        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const isArray = Array.isArray(value);

        return (
          <div key={key} className='pb-4'>
            <div className='flex items-center mb-1 align-middle gap-1'>
              <h3
                className={`font-medium text-gray-900 ${
                  level === 0 ? 'text-xl' : 'text-base'
                }`}
              >
                {label}
              </h3>
              {isArray && (
                <div className='text-xs text-primary-600 font-medium mr-2'>
                  ({Array.isArray(value) ? value.length : 0})
                </div>
              )}
            </div>
            <div className={`${level > 0 ? 'ml-2 mt-4' : 'mt-4'}`}>
              <LegislativeDetailSection data={value} level={level + 1} />
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
