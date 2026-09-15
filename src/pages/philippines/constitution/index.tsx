import { ScrollTextIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../../components/SEO';
import { getConstitutionSEOData } from '../../../utils/seo-data';
import { cn } from '../../../lib/utils';
import { constitutionVersions } from './data';
import FullTextReader from './components/FullTextReader';

const statusLabel: Record<string, string> = {
  'in-force': 'In force',
  superseded: 'Superseded',
  suspended: 'Suspended',
  interim: 'Interim',
  'never-implemented': 'Never implemented',
};

const statusClass: Record<string, string> = {
  'in-force': 'bg-green-50 text-green-700 ring-1 ring-green-200',
  superseded: 'bg-gray-100 text-gray-800 ring-1 ring-gray-200',
  suspended: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  interim: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'never-implemented': 'bg-gray-100 text-gray-800 ring-1 ring-gray-200',
};

function VersionDetail({
  version,
}: {
  version: (typeof constitutionVersions)[number];
}) {
  return (
    <div className='space-y-6'>
      <div>
        <div className='flex flex-wrap items-center gap-2 mb-2'>
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              statusClass[version.status]
            )}
          >
            {statusLabel[version.status]}
          </span>
          <span className='text-sm text-gray-800'>{version.period}</span>
        </div>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 mb-2'>
          {version.name}
        </h1>
        <p className='text-sm text-gray-800'>
          {version.effectiveDate && (
            <>
              In effect from <strong>{version.effectiveDate}</strong>
              {version.endDate ? (
                <>
                  {' '}
                  to <strong>{version.endDate}</strong>
                </>
              ) : (
                <> to the present</>
              )}
              .
            </>
          )}
        </p>
      </div>

      <p className='text-gray-800 leading-relaxed'>{version.summary}</p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='text-sm font-semibold text-gray-900 mb-1'>
            Form of Government
          </h3>
          <p className='text-sm text-gray-800'>{version.formOfGovernment}</p>
        </div>
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='text-sm font-semibold text-gray-900 mb-1'>
            Branch Structure
          </h3>
          <p className='text-sm text-gray-800'>{version.branchStructure}</p>
        </div>
        <div className='bg-gray-50 rounded-lg p-4 md:col-span-2'>
          <h3 className='text-sm font-semibold text-gray-900 mb-1'>
            Rights &amp; Liberties
          </h3>
          <p className='text-sm text-gray-800'>{version.rights}</p>
        </div>
      </div>

      <div>
        <h3 className='text-base font-semibold text-gray-900 mb-3'>
          What Changed
        </h3>
        <ul className='space-y-2'>
          {version.keyChanges.map((change, i) => (
            <li key={i} className='flex items-start text-sm text-gray-800'>
              <span className='mt-1.5 mr-2 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0' />
              <span>{change}</span>
            </li>
          ))}
        </ul>
      </div>

      {version.fullText ? (
        <FullTextReader fullText={version.fullText} />
      ) : (
        <div className='border-t border-gray-200 pt-6 mt-8 text-sm text-gray-800'>
          The full text for this constitution hasn&apos;t been added yet.{' '}
          {version.fullTextUrl ? (
            <a
              href={version.fullTextUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary-600 hover:underline'
            >
              Read it at the source
            </a>
          ) : (
            <a
              href={version.sourceUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary-600 hover:underline'
            >
              Read it at the source
            </a>
          )}
          .
        </div>
      )}
    </div>
  );
}

function TimelineOverview() {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 mb-2'>
          The Constitutions of the Philippines
        </h1>
        <p className='text-gray-800 leading-relaxed max-w-3xl'>
          From the 1899 Malolos Constitution&mdash;the first republican
          constitution in Asia&mdash;to the 1987 Constitution in force today,
          the Philippines has been governed under several charters. Select a
          version from the list to see what it changed from the one before it.
        </p>
      </div>

      <div className='relative'>
        <div className='absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200' />
        <ol className='space-y-6'>
          {constitutionVersions.map(version => (
            <li key={version.slug} className='relative pl-12'>
              <span
                className={cn(
                  'absolute left-0 top-1 h-8 w-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center',
                  version.status === 'in-force'
                    ? 'bg-primary-500'
                    : 'bg-gray-300'
                )}
              >
                <ScrollTextIcon className='h-4 w-4 text-white' />
              </span>
              <Link
                to={`/philippines/constitution/${version.slug}`}
                className='block bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all'
              >
                <div className='flex flex-wrap items-center gap-2 mb-1'>
                  <span className='font-semibold text-gray-900'>
                    {version.shortName}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      statusClass[version.status]
                    )}
                  >
                    {statusLabel[version.status]}
                  </span>
                </div>
                <p className='text-sm text-gray-800'>{version.period}</p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ConstitutionIndex() {
  const { version: versionParam } = useParams();
  const selectedVersion = versionParam
    ? constitutionVersions.find(v => v.slug === versionParam)
    : undefined;

  const seoData = getConstitutionSEOData(selectedVersion?.shortName);

  return (
    <>
      <SEO
        keywords={seoData.keywords}
        canonical={seoData.canonical}
        breadcrumbs={seoData.breadcrumbs}
        jsonLd={seoData.jsonLd}
      />
      <div className='@container'>
        {selectedVersion ? (
          <VersionDetail version={selectedVersion} />
        ) : (
          <TimelineOverview />
        )}
      </div>
    </>
  );
}
