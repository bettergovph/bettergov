import { ScaleIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';
import judicialData from '../../../../data/directory/judicial.json';

export default function JudicialSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const filteredCourts = judicialData.filter(court =>
    court.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCourtSelect = (slug: string) => {
    navigate(`/government/judicial/${encodeURIComponent(slug)}`, {
      state: { scrollToContent: true },
    });
  };

  const isActive = (slug: string) => location.pathname.includes(slug);

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4'>
        <div className='mb-4'>
          <input
            type='text'
            placeholder='Search courts...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
          />
        </div>
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Courts
          </h3>
          {filteredCourts.length === 0 ? (
            <div className='p-4 text-center text-sm text-gray-800'>
              No courts found
            </div>
          ) : (
            <ul className='space-y-1'>
              {filteredCourts.map(court => (
                <li key={court.slug}>
                  <button
                    title={court.name}
                    onClick={() => handleCourtSelect(court.slug)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                      isActive(court.slug)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center'>
                      <ScaleIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                      <span className='truncate'>{court.name}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>
    </StandardSidebar>
  );
}
