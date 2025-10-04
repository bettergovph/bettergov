import {
  MapPinIcon,
  ExternalLinkIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react';

import { useParams } from 'react-router-dom';

import judiciaryData from '../../../data/directory/judiciary.json';

import { Card, CardHeader, CardContent } from '../../../components/ui/CardList';

interface Justice {
  name: string;
  position: string;
  dateOfAppointment: string;
  dateOfRetirement: string;
}

interface SupremeCourtJustice extends Justice {
  birthdate: string;
  age: number;
  placeOfBirth: string;
  appointingPresident: string;
  lawSchool: string;
  previousPosition: string;
  replacing: string;
}

interface COAJustice extends Justice {
  role: string;
  division: string;
}

// Component to render Justices in a card grid
function JusticesGrid({
  members: justices,
  courtType,
}: {
  members: SupremeCourtJustice[] | COAJustice[];
  courtType: 'supreme_court' | 'court_of_appeals';
}) {
  if (courtType === 'supreme_court') {
    return (
      <div className='grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-6'>
        {(justices as SupremeCourtJustice[]).map((justice, index) => (
          <Card key={index} hover={false} className='h-full flex flex-col'>
            <CardHeader className='flex-none'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex-1'>
                  <h3 className='font-semibold text-base text-gray-900 leading-tight'>
                    {justice.name}
                  </h3>
                  <p className='text-sm text-primary-600 font-medium mt-1'>
                    {justice.position}
                  </p>
                </div>
                <div className='rounded-full bg-gray-100 p-2 shrink-0'>
                  <UserIcon className='h-5 w-5 text-gray-600' />
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-1'>
              <div className='flex items-start gap-2 text-sm'>
                <PhoneIcon className='h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5' />
                <span className='text-gray-700'>{justice.lawSchool}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return <div>Nothing here yet</div>;
}

function JudiciaryDetailSection({
  courtMembers,
}: {
  courtMembers: SupremeCourtJustice[] | COAJustice[];
}) {
  return (
    <div>
      <div className='flex items-center mb-3 align-middle gap-2'>
        <h2 className='text-2xl font-bold text-gray-900'>Justices</h2>
        <div className='text-sm text-primary-600 font-medium bg-primary-50 px-2.5 py-1 rounded-md'>
          {courtMembers.length}
        </div>
      </div>

      <JusticesGrid courtType='supreme_court' members={courtMembers} />
    </div>
  );
}

export default function JudiciaryDetail() {
  const { court: courtName } = useParams<{ court: string }>();
  const court = judiciaryData.find(
    c => c.slug === decodeURIComponent(courtName || '')
  );

  if (!court) {
    return (
      <div className='bg-white rounded-lg border p-8 text-center h-full flex flex-col items-center justify-center'>
        <h2 className='text-2xl font-semibold mb-4'>Department not found</h2>
        <p className='text-gray-800'>
          Please select a judiciary court from the sidebar.
        </p>
      </div>
    );
  }

  const {
    office,
    address,
    trunkline,
    website,
    // members
  } = court;
  const displayName = office;

  return (
    <div className='@container space-y-4'>
      {/* Department Header */}
      <div className='border-b pb-4'>
        <div className='space-y-2'>
          <h2 className='text-3xl font-bold text-gray-900'>{displayName}</h2>
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
          {/* {email && (
            <a
              href={`mailto:${email}`}
              className='flex items-center text-gray-800 hover:text-primary-600 text-sm'
            >
              <MailIcon className='h-4 w-4 text-gray-800 mr-1 flex-shrink-0' />
              <span>{email}</span>
            </a>
          )} */}
        </div>
      </div>
      {/* Department Details */}
      {/* <div>
        <DepartmentDetailSection data={details} />
      </div> */}
      <JudiciaryDetailSection courtMembers={court.members} />
    </div>
  );
}
