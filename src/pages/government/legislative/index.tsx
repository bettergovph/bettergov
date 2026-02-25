import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLegislative } from '../../../lib/cms-data';

export default function LegislativeIndex() {
  const navigate = useNavigate();

  // Redirect to the first chamber on load
  useEffect(() => {
    fetchLegislative()
      .then((data: Array<Record<string, unknown>>) => {
        if (data.length > 0) {
          const firstChamber = data[0].slug;
          navigate(
            `/government/legislative/${encodeURIComponent(firstChamber)}`
          );
        }
      })
      .catch(err => {
        console.error('Failed to load legislative data:', err);
      });
  }, [navigate]);

  return (
    <div className='flex items-center justify-center h-64'>
      <div className='text-center'>
        <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4'></div>
        <p className='text-gray-800'>Loading legislative branch data...</p>
      </div>
    </div>
  );
}
