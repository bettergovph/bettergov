import { ScaleIcon, ExternalLinkIcon, MapPinIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { getJudicialSEOData } from '../../../utils/seo-data';
import judicialData from '../../../data/directory/judicial.json';

type JudicialCourt = (typeof judicialData)[number];

export default function JudicialIndex() {
  const { court: courtParam } = useParams();
  const [selectedCourt, setSelectedCourt] = useState<JudicialCourt | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (courtParam) {
      const court = judicialData.find(
        c => c.slug === decodeURIComponent(courtParam)
      );
      if (court) {
        setSelectedCourt(court);
      }
    } else if (judicialData.length > 0) {
      setSelectedCourt(judicialData[0]);
      navigate(
        `/government/judicial/${encodeURIComponent(judicialData[0].slug)}`
      );
    } else {
      setSelectedCourt(null);
    }
  }, [courtParam, navigate]);

  const seoData = getJudicialSEOData(selectedCourt?.name);

  if (!selectedCourt) {
    return (
      <>
        <SEO
          keywords={seoData.keywords}
          canonical={seoData.canonical}
          breadcrumbs={seoData.breadcrumbs}
          jsonLd={seoData.jsonLd}
        />
        <div className='@container bg-white rounded-lg border p-8 text-center h-full flex flex-col items-center justify-center'>
          <div className='mx-auto w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4'>
            <ScaleIcon className='h-6 w-6 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>
            No court selected
          </h3>
          <p className='text-gray-800 max-w-md'>
            Select a court from the list to view its details and justices.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        keywords={seoData.keywords}
        canonical={seoData.canonical}
        breadcrumbs={seoData.breadcrumbs}
        jsonLd={seoData.jsonLd}
      />
      <div className='@container space-y-6'>
        {/* Court Header */}
        <div className='flex flex-col space-y-2'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            {selectedCourt.name}
          </h1>
          {selectedCourt.description && (
            <p className='text-gray-800 text-sm'>{selectedCourt.description}</p>
          )}
          {selectedCourt.address && (
            <p className='mt-2 text-gray-800 flex items-start text-sm'>
              <MapPinIcon className='h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0' />
              <span>{selectedCourt.address}</span>
            </p>
          )}
          {selectedCourt.website && (
            <div className='flex space-x-2 flex-row text-sm'>
              <ExternalLinkIcon className='h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0' />
              <a
                href={`https://${selectedCourt.website}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-600 hover:underline'
              >
                {selectedCourt.website}
              </a>
            </div>
          )}
        </div>

        {/* Justices Table */}
        {selectedCourt.officials && selectedCourt.officials.length > 0 && (
          <div>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              Incumbent Justices{' '}
              <span className='text-sm font-normal text-primary-600'>
                ({selectedCourt.officials.length})
              </span>
            </h2>
            <div className='overflow-x-auto rounded-lg border border-gray-200'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left font-medium text-gray-700'>
                      #
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-700'>
                      Name
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-700'>
                      Position
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-700'>
                      Date of Appointment
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 bg-white'>
                  {selectedCourt.officials.map((justice, index) => (
                    <tr
                      key={index}
                      className='hover:bg-gray-50 transition-colors'
                    >
                      <td className='px-4 py-3 text-gray-500'>{index + 1}</td>
                      <td className='px-4 py-3 font-medium text-gray-900'>
                        {justice.name}
                      </td>
                      <td className='px-4 py-3 text-gray-700'>
                        {justice.role}
                      </td>
                      <td className='px-4 py-3 text-gray-500'>
                        {justice.date_of_appointment || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
