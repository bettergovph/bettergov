import {
  Building2Icon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { getConstitutionalSEOData } from '../../../utils/seo-data';
import { type ConstitutionalOffice } from '../schema';
import { constitutionalData as offices } from './data';
import { cn } from '../../../lib/utils';

// Recursive component to render office details
function OfficeDetailSection({
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
            <OfficeDetailSection data={item} level={level + 1} />
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
    'name',
    'slug',
    'office_type',
    'description',
    'address',
    'trunklines',
    'trunk_line',
    'website',
    'email',
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

          return (
            <div key={key} className='text-sm'>
              <div className='text-gray-800 leading-relaxed'>
                {String(value)}
              </div>
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
    <div className='space-y-4'>
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
              <OfficeDetailSection data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ConstitutionalIndex() {
  const { office: officeParam } = useParams();
  const [selectedOffice, setSelectedOffice] =
    useState<ConstitutionalOffice | null>(null);
  const navigate = useNavigate();

  // Set selected office based on URL param or first office
  useEffect(() => {
    if (officeParam) {
      const office = offices.find(
        o => o.slug === decodeURIComponent(officeParam)
      );
      if (office) {
        setSelectedOffice(office);
      }
    } else if (offices.length > 0) {
      setSelectedOffice(offices[0]);
      navigate(
        `/government/constitutional/${encodeURIComponent(offices[0].slug)}`
      );
    } else {
      setSelectedOffice(null);
    }
  }, [officeParam, navigate]);

  const seoData = getConstitutionalSEOData(selectedOffice?.name);

  if (!selectedOffice) {
    return (
      <>
        <SEO {...seoData} />
        <div className='@container bg-white rounded-lg border p-8 text-center h-full flex flex-col items-center justify-center'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <Building2Icon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No constitutional office selected
          </h3>
          <p className='text-gray-800 max-w-md'>
            Select a constitutional office from the list to view its details and
            contact information.
          </p>
        </div>
      </>
    );
  }

  // Determine which contact number to display
  const contactNumber = selectedOffice.trunklines
    ? selectedOffice.trunklines[0]
    : selectedOffice.trunk_line;

  return (
    <>
      <SEO {...seoData} />
      <div className='@container space-y-6'>
        <div className='flex flex-col space-y-2'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {selectedOffice.name}
            </h1>

            {selectedOffice.description && (
              <p className='text-gray-800 text-sm'>
                {selectedOffice.description}
              </p>
            )}

            {selectedOffice.address && (
              <p className='mt-2 text-gray-800 flex items-start text-sm'>
                <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
                <span>{selectedOffice.address}</span>
              </p>
            )}
          </div>

          {selectedOffice.website && (
            <div className='flex space-x-2 flex-row text-sm'>
              <ExternalLinkIcon className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
              <a
                href={
                  selectedOffice.website.startsWith('http')
                    ? selectedOffice.website
                    : `https://${selectedOffice.website}`
                }
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:underline flex items-center'
              >
                {selectedOffice.website}
              </a>
            </div>
          )}

          {contactNumber && (
            <div className='flex items-center text-gray-800 text-sm'>
              <PhoneIcon className='h-4 w-4 text-gray-800 mr-1.5 flex-shrink-0' />
              <span>{contactNumber}</span>
            </div>
          )}

          {selectedOffice.email && (
            <a
              href={`mailto:${selectedOffice.email}`}
              className='flex items-center text-gray-800 hover:text-primary-600'
            >
              <MailIcon className='h-4 w-4 text-gray-800 mr-1.5 flex-shrink-0' />
              <span>{selectedOffice.email}</span>
            </a>
          )}
        </div>

        <div>
          <OfficeDetailSection data={selectedOffice} />
        </div>
      </div>
    </>
  );
}
