import { Building2Icon, DatabaseIcon, GraduationCapIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';
import { type ConstitutionalOffice } from '../../schema';
import { constitutionalData } from '../data';

interface ConstitutionalSidebarProps {
  onOfficeSelect?: (office: ConstitutionalOffice) => void;
}

// Only include constitutional offices (exclude GOCCs and SUCs)
const offices = constitutionalData.filter(
  office =>
    !office.office_type.includes('Government-Owned') &&
    !office.office_type.includes('GOCCs') &&
    !office.office_type.includes('State Universities') &&
    !office.office_type.includes('SUCs')
);

export default function ConstitutionalSidebar({
  onOfficeSelect,
}: ConstitutionalSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { office: officeParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm) return offices;

    return offices.filter(office =>
      office.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleOfficeSelect = (office: ConstitutionalOffice) => {
    if (onOfficeSelect) {
      onOfficeSelect(office);
    }
    navigate(`/government/constitutional/${encodeURIComponent(office.slug)}`, {
      state: { scrollToContent: true },
    });
  };

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4'>
        {/* TODO: some PR breaks the search, adding a temporary one*/}
        <div className='mb-4'>
          <input
            type='text'
            placeholder='Search constitutional offices...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          />
        </div>
        {/* Constitutional offices */}
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Constitutional Offices
          </h3>
          {filteredOffices.length === 0 ? (
            <div className='p-4 text-center text-sm text-gray-800'>
              No offices found
            </div>
          ) : (
            <ul className='space-y-1'>
              {filteredOffices.map(office => (
                <li key={office.name}>
                  <button
                    title={office.name}
                    onClick={() => handleOfficeSelect(office)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                      officeParam === office.slug
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center'>
                      <Building2Icon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                      <span className='truncate'>{office.name}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Special category links */}
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Others
          </h3>
          <ul className='space-y-1'>
            <li>
              <Link
                title='Govenment-Owned Corporations'
                to='/government/constitutional/goccs'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/constitutional/goccs')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <DatabaseIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Government-Owned Corporations</span>
              </Link>
            </li>
            <li>
              <Link
                title='State Universities & Colleges'
                to='/government/constitutional/sucs'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/constitutional/sucs')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GraduationCapIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>State Universities &amp; Colleges</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
