import { useNavigate, useParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useState } from 'react';
import departmentsData from '../../../../data/directory/departments.json';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

interface Department {
  office_name: string;
  address?: string;
  trunkline?: string;
  website?: string;
  email?: string;
  [key: string]: unknown;
}

interface DepartmentsSidebarProps {
  onDepartmentSelect?: (department: Department) => void;
}

export default function DepartmentsSidebar({
  onDepartmentSelect,
}: DepartmentsSidebarProps) {
  const [searchTerm] = useState('');
  const { department: departmentParam } = useParams();
  const navigate = useNavigate();
  const departments = departmentsData as Department[];

  const filteredDepartments = departments.filter(dept =>
    dept.office_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeptSelect = (dept: Department) => {
    if (onDepartmentSelect) {
      onDepartmentSelect(dept);
    }
    navigate(`/government/departments/${encodeURIComponent(dept.slug)}`, {
      state: { scrollToContent: true },
    });
  };

  return (
    <StandardSidebar>
      {filteredDepartments.length === 0 ? (
        <div className='p-4 text-center text-sm text-gray-800'>
          No departments found
        </div>
      ) : (
        <nav className='p-1'>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Department of
          </h3>
          <ul className='space-y-1'>
            {filteredDepartments.map(dept => (
              <li key={dept.slug}>
                <button
                  onClick={() => handleDeptSelect(dept)}
                  className={`w-full text-left px-4 py-3 text-sm rounded-md transition-colors ${
                    departmentParam === dept.slug
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center'>
                    <Building2 className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                    <span className='truncate'>
                      {dept.office_name.replace('DEPARTMENT OF ', '')}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </StandardSidebar>
  );
}
