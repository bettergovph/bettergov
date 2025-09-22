import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import legislativeData from '../../../data/directory/legislative.json';

export default function LegislativeIndex() {
  const navigate = useNavigate();

  // Redirect to the first chamber on load
  useEffect(() => {
    if (legislativeData.length > 0) {
      const firstChamber = legislativeData[0].slug;
      navigate(`/government/legislative/${encodeURIComponent(firstChamber)}`);
    }
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
