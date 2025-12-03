import { FC } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { CalendarIcon } from 'lucide-react';

interface Holiday {
  event: string;
  date: string;
  day: string;
}

const REGULAR_HOLIDAYS: Holiday[] = [
  { event: "New Year's Day", date: 'January 1', day: 'Wednesday' },
  {
    event: "Eid'l Fitr (Feast of Ramadhan)",
    date: 'April 1',
    day: 'Tuesday',
  },
  { event: 'Araw ng Kagitingan', date: 'April 9', day: 'Wednesday' },
  { event: 'Maundy Thursday', date: 'April 17', day: 'Thursday' },
  { event: 'Good Friday', date: 'April 18', day: 'Friday' },
  { event: 'Labor Day', date: 'May 1', day: 'Thursday' },
  { event: 'Eidul Adha (Feast of Sacrifice)', date: 'June 6', day: 'Friday' },
  { event: 'Independence Day', date: 'June 12', day: 'Thursday' },
  { event: 'National Heroes Day', date: 'August 25', day: 'Monday' },
  { event: 'Bonifacio Day', date: 'November 30', day: 'Sunday' },
  { event: 'Christmas Day', date: 'December 25', day: 'Thursday' },
  { event: 'Rizal Day', date: 'December 30', day: 'Tuesday' },
];

const SPECIAL_HOLIDAYS: Holiday[] = [
  { event: 'Chinese New Year', date: 'January 29', day: 'Wednesday' },
  { event: 'Black Saturday', date: 'April 19', day: 'Saturday' },
  { event: 'National and Local Elections', date: 'May 12', day: 'Monday' },
  { event: 'Ninoy Aquino Day', date: 'August 21', day: 'Thursday' },
  { event: "All Saints' Day Eve", date: 'October 31', day: 'Friday' },
  { event: "All Saints' Day", date: 'November 1', day: 'Saturday' },
  {
    event: 'Feast of the Immaculate Conception of Mary',
    date: 'December 8',
    day: 'Monday',
  },
  { event: 'Christmas Eve', date: 'December 24', day: 'Wednesday' },
  { event: 'Last Day of the Year', date: 'December 31', day: 'Wednesday' },
];

function getHolidayWithDynamicDay(
  holiday: Holiday,
  currentYear: number
): Holiday {
  const fullDate = new Date(`${holiday.date} ${currentYear}`);

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayName = days[fullDate.getDay()];

  return {
    ...holiday,
    day: dayName,
  };
}

const HolidayTable = ({
  holidays,
  title,
}: {
  holidays: Holiday[];
  title: string;
}) => (
  <div className='mb-8'>
    <h2 className='text-2xl font-bold text-gray-800 mb-4 flex items-center'>
      <CalendarIcon className='mr-2 h-6 w-6 text-blue-600' />
      {title}
    </h2>
    <Card className='overflow-hidden'>
      <CardHeader className='bg-blue-50 border-b border-blue-100'>
        <h3 className='text-lg font-semibold text-blue-800'>
          {title} ({holidays.length})
        </h3>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider'
                >
                  Event
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider'
                >
                  Date
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider'
                >
                  Day
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {holidays.map((holiday, index) => (
                <tr key={index} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>
                      {holiday.event}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{holiday.date}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                      {holiday.day}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PublicHolidays: FC = () => {
  const currentYear = new Date().getFullYear();

  const regularHolidays = REGULAR_HOLIDAYS.map(holiday =>
    getHolidayWithDynamicDay(holiday, currentYear)
  );
  const specialHolidays = SPECIAL_HOLIDAYS.map(holiday =>
    getHolidayWithDynamicDay(holiday, currentYear)
  );

  return (
    <div className='max-w-6xl px-4 py-8 sm:mx-auto sm:px-6 lg:px-8'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl'>
          Philippine Public Holidays {currentYear}
        </h1>
        <p className='mt-3 max-w-2xl mx-auto text-xl text-gray-800 sm:mt-4'>
          Official non-working holidays in the Philippines
        </p>
      </div>

      <div className='mb-6 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md'>
        <div className='flex'>
          <div className='shrink-0'>
            <svg
              className='h-5 w-5 text-yellow-400'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <p className='text-sm text-yellow-700'>
              Note: This list is based on the official holidays declared by the
              Philippine government for the year 2025. Dates may be subject to
              change based on official announcements.
            </p>
          </div>
        </div>
      </div>

      <div className='space-y-12'>
        <HolidayTable title='A. Regular Holidays' holidays={regularHolidays} />

        <HolidayTable
          title='B. Special (Non-Working) Holidays'
          holidays={specialHolidays}
        />
      </div>
    </div>
  );
};

export default PublicHolidays;
