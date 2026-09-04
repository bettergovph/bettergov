import { BookOpenIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';
import { cn } from '../../../../lib/utils';
import { constitutionVersions } from '../data';

const statusLabel: Record<string, string> = {
  'in-force': 'In force',
  superseded: 'Superseded',
  suspended: 'Suspended',
  interim: 'Interim',
  'never-implemented': 'Never implemented',
};

const statusClass: Record<string, string> = {
  'in-force': 'bg-green-50 text-green-700',
  superseded: 'bg-gray-100 text-gray-800',
  suspended: 'bg-amber-50 text-amber-700',
  interim: 'bg-blue-50 text-blue-700',
  'never-implemented': 'bg-amber-50 text-amber-700',
};

export default function ConstitutionSidebar() {
  const { version: versionParam } = useParams();

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-2'>
        <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
          Constitutions, 1899&ndash;Present
        </h3>
        <ul className='space-y-1'>
          {constitutionVersions.map(version => {
            const isActive = versionParam === version.slug;
            return (
              <li key={version.slug}>
                <Link
                  to={`/philippines/constitution/${version.slug}`}
                  title={version.name}
                  className={cn(
                    'block px-3 py-2 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className='flex items-center'>
                    <BookOpenIcon className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                    <span className='truncate'>{version.shortName}</span>
                  </div>
                  <span
                    className={cn(
                      'inline-block mt-1 ml-6 px-1.5 py-0.5 rounded text-[11px] font-medium',
                      statusClass[version.status]
                    )}
                  >
                    {statusLabel[version.status]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </StandardSidebar>
  );
}
