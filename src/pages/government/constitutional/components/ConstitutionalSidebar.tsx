import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Building2, Database, GraduationCap } from 'lucide-react';
import { useState, useMemo } from 'react';
import constitutionalData from '../../../../data/directory/constitutional.json';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

interface ConstitutionalOffice {
  name: string;
  office_type: string;
  description?: string;
  address?: string;
  trunklines?: string[];
  trunk_line?: string;
  website?: string;
  email?: string;
  [key: string]: unknown;
}

interface ConstitutionalSidebarProps {
  onOfficeSelect?: (office: ConstitutionalOffice) => void;
}

export default function ConstitutionalSidebar({
  onOfficeSelect,
}: ConstitutionalSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { office: officeParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Only include constitutional offices (exclude GOCCs and SUCs)
  const offices = useMemo(() => {
    return constitutionalData.filter(
      (office: ConstitutionalOffice) =>
        !office.office_type.includes('Government-Owned') &&
        !office.office_type.includes('GOCCs') &&
        !office.office_type.includes('State Universities') &&
        !office.office_type.includes('SUCs')
    ) as ConstitutionalOffice[];
  }, []);

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm) return offices;

    return offices.filter(office =>
      office.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offices, searchTerm]);

  const handleOfficeSelect = (office: ConstitutionalOffice) => {
    if (onOfficeSelect) {
      onOfficeSelect(office);
    }
    navigate(`/government/constitutional/${encodeURIComponent(office.slug)}`);
  };

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StandardSidebar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder='Search constitutional offices...'
    >
      <nav className='p-2 space-y-4'>
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
                    onClick={() => handleOfficeSelect(office)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      officeParam === office.slug
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center'>
                      <Building2 className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
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
                to='/government/constitutional/goccs'
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/constitutional/goccs')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Database className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Government-Owned Corporations</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/constitutional/sucs'
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/constitutional/sucs')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>State Universities & Colleges</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
