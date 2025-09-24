import {
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import departmentsData from '../../../data/directory/departments.json';
import { cn } from '../../../lib/utils';

interface Department {
  office_name: string;
  address?: string;
  trunkline?: string;
  website?: string;
  email?: string;
  [key: string]: unknown;
}

// Recursive component to render nested department details
function DepartmentDetailSection({
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
              level > 0 ? 'ml-4 border-l border-neutral-100  border-b pl-3' : ''
            }`}
          >
            <DepartmentDetailSection data={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Check if this is a simple key-value object with no nested objects
  const isSimpleObject = Object.values(data).every(
    value => value === null || typeof value !== 'object'
  );

  if (isSimpleObject) {
    return (
      <div
        className={cn(
          'mb-4 grid grid-cols-1 @sm:grid-cols-2 gap-x-6 max-w-3xl',
          level === 1 && 'rounded-2xl font-bold text-lg'
        )}
      >
        {Object.entries(data).map(([key, value]) => {
          if (key === 'office_name' || value === undefined) return null;
          if (key === 'slug' || value === undefined) return null;

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

  return (
    <div className='@container space-y-4'>
      {Object.entries(data).map(([key, value]) => {
        if (key === 'office_name' || value === undefined) return null;
        if (key === 'slug' || value === undefined) return null;

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
              <DepartmentDetailSection data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DepartmentDetail() {
  const { department: departmentName } = useParams<{ department: string }>();
  const department = (departmentsData as Department[]).find(
    d => d.slug === decodeURIComponent(departmentName || '')
  );

  if (!department) {
    return (
      <div className='bg-white rounded-lg border p-8 text-center h-full flex flex-col items-center justify-center'>
        <h2 className='text-2xl font-semibold mb-4'>Department not found</h2>
        <p className='text-gray-800'>
          Please select a department from the sidebar.
        </p>
      </div>
    );
  }

  // Extract top-level details
  const { office_name, address, trunkline, website, email, ...details } =
    department;
  const displayName = office_name;

  return (
    <div className='@container space-y-4'>
      {/* Department Header */}
      <div className='border-b pb-4'>
        <div className='space-y-2'>
          <h2 className='text-xl font-bold text-gray-900'>{displayName}</h2>
          {address && (
            <p className='mt-1 text-gray-800 flex items-start text-sm'>
              <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
              <span>{address}</span>
            </p>
          )}
          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center text-primary-600 hover:text-primary-800 text-sm'
            >
              <ExternalLinkIcon className='h-4 w-4 mr-1' />
              <span>{website}</span>
            </a>
          )}
          {trunkline && (
            <div className='flex items-center text-gray-800 text-sm'>
              <PhoneIcon className='h-4 w-4 text-gray-800 mr-1 flex-shrink-0' />
              <span>{trunkline}</span>
            </div>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className='flex items-center text-gray-800 hover:text-primary-600 text-sm'
            >
              <MailIcon className='h-4 w-4 text-gray-800 mr-1 flex-shrink-0' />
              <span>{email}</span>
            </a>
          )}
        </div>
      </div>
      {/* Department Details */}
      <div>
        <DepartmentDetailSection data={details} />
      </div>
    </div>
  );
}
