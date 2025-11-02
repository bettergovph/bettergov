import {
  ArrowRightIcon,
  Building2Icon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { Card, CardContent, CardHeader } from '../../../components/ui/CardList';
import departmentsData from '../../../data/directory/departments.json';
import { getDepartmentsSEOData } from '../../../utils/seo-data';

interface Department {
  office_name: string;
  slug: string;
  address?: string;
  trunkline?: string;
  website?: string;
  email?: string;
  secretary?: {
    name: string;
    contact?: string;
    email?: string;
  };
  [key: string]: unknown;
}

// Component to display department details
function DepartmentDetail({ departmentName }: { departmentName: string }) {
  const departments = departmentsData as Department[];
  const department = departments.find(d => d.slug === departmentName);
  const seoData = getDepartmentsSEOData(departmentName);

  if (!department) {
    return (
      <>
        <SEO {...seoData} />
        <div className='bg-white rounded-lg border p-8 text-center h-full flex flex-col items-center justify-center'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <Building2Icon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            Department not found
          </h3>
          <p className='text-gray-800 max-w-md'>
            The department you&apos;re looking for doesn&apos;t exist or has
            been moved.
          </p>
          <Link
            to='/government/departments'
            className='mt-4 text-primary-600 hover:underline flex items-center'
          >
            <ArrowRightIcon className='h-4 w-4 mr-1 rotate-180' />
            Back to all departments
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO {...seoData} />
      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              {department.office_name.replace('DEPARTMENT OF ', '')}
            </h1>

            {department.address && (
              <p className='mt-2 text-gray-800 flex items-start'>
                <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 shrink-0' />
                <span>{department.address}</span>
              </p>
            )}
          </div>

          <div className='flex space-x-2'>
            <Link
              to='/government/departments'
              className='inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50'
            >
              <ArrowRightIcon className='mr-1.5 h-3.5 w-3.5 rotate-180' />
              <span>All Departments</span>
            </Link>

            {department.website && (
              <a
                href={
                  department.website.startsWith('http')
                    ? department.website
                    : `https://${department.website}`
                }
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50'
              >
                <span>Website</span>
                <ExternalLinkIcon className='ml-1.5 h-3.5 w-3.5' />
              </a>
            )}
          </div>
        </div>

        <div className='flex flex-wrap gap-4 text-sm border-b border-gray-200 pb-6'>
          {department.trunkline && (
            <div className='flex items-center text-gray-800'>
              <PhoneIcon className='h-4 w-4 text-gray-800 mr-1.5 shrink-0' />
              <span>{department.trunkline}</span>
            </div>
          )}

          {department.email && (
            <a
              href={`mailto:${department.email}`}
              className='flex items-center text-gray-800 hover:text-primary-600'
            >
              <MailIcon className='h-4 w-4 text-gray-800 mr-1.5 shrink-0' />
              <span>{department.email}</span>
            </a>
          )}
        </div>

        <div>
          <DepartmentDetailSection data={department} />
        </div>
      </div>
    </>
  );
}

// Recursive component to render department details
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
      <ul className={`space-y-2 ${level > 0 ? 'pl-4' : ''}`}>
        {data.map((item, index) => (
          <li key={index} className='border-l-2 pl-4 border-gray-100'>
            <DepartmentDetailSection data={item} level={level + 1} />
          </li>
        ))}
      </ul>
    );
  }

  // Skip these keys as they're displayed in the header
  const skipKeys = [
    'office_name',
    'address',
    'trunkline',
    'website',
    'email',
    'slug',
  ];

  const entries = Object.entries(data).filter(
    ([key]) => !skipKeys.includes(key)
  );

  if (entries.length === 0) return null;

  return (
    <div
      className={`space-y-4 ${
        level > 0 ? 'pl-4 border-l-2 border-gray-100' : ''
      }`}
    >
      {entries.map(([key, value]) => {
        if (value === undefined || value === null) return null;

        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return (
          <div key={key} className='space-y-1'>
            <h3 className='font-medium text-gray-900'>{label}</h3>
            <div className='text-gray-800'>
              <DepartmentDetailSection data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DepartmentsIndex() {
  const { department: departmentParam } = useParams();
  const departments = departmentsData as Department[];
  const seoData = getDepartmentsSEOData();

  // If we have a specific department parameter, show the department detail view
  if (departmentParam) {
    return (
      <DepartmentDetail departmentName={decodeURIComponent(departmentParam)} />
    );
  }

  // Otherwise show the departments grid
  return (
    <>
      <SEO {...seoData} />
      <div className='space-y-8 @container'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Government Departments
          </h1>
          <p className='text-gray-800 max-w-3xl'>
            Browse through the official government departments. Each department
            is responsible for specific areas of governance and public service
            delivery.
          </p>
        </div>
        <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
          {departments.map((dept, index) => {
            // Extract department name without "DEPARTMENT OF" prefix for cleaner display
            const deptName = dept.office_name.replace('DEPARTMENT OF ', '');

            return (
              <Link
                to={`/government/departments/${encodeURIComponent(dept.slug)}`}
                state={{ scrollToContent: true }}
                key={index}
                className='block'
              >
                <Card hover={true} className='h-full flex flex-col'>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <h3 className='font-bold text-lg text-gray-900'>
                          {deptName}
                        </h3>
                        {dept.secretary && (
                          <p className='text-sm text-gray-800 mt-1'>
                            Secretary: {dept.secretary.name}
                          </p>
                        )}
                      </div>
                      <div className='rounded-full bg-gray-100 p-2 shrink-0'>
                        <Building2Icon className='h-5 w-5 text-gray-800' />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='flex flex-col h-full grow'>
                    <div className='space-y-2 flex-1'>
                      {dept.address && (
                        <div className='flex items-start'>
                          <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 shrink-0' />
                          <span className='text-sm text-gray-800 line-clamp-2'>
                            {dept.address}
                          </span>
                        </div>
                      )}
                      {dept.trunkline && (
                        <div className='flex items-center'>
                          <PhoneIcon className='h-4 w-4 text-gray-400 mr-2 shrink-0' />
                          <span className='text-sm text-gray-800'>
                            {dept.trunkline}
                          </span>
                        </div>
                      )}
                      {dept.website && (
                        <div className='flex items-center'>
                          <ExternalLinkIcon className='h-4 w-4 text-gray-400 mr-2 shrink-0' />
                          <span className='text-sm text-primary-600 truncate'>
                            {dept.website}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='mt-4 pt-4 border-t border-gray-100 flex justify-end'>
                      <span className='text-sm font-medium text-primary-600 flex items-center'>
                        View details{' '}
                        <ArrowRightIcon className='ml-1 h-3.5 w-3.5' />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
