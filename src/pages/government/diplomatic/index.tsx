import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DiplomaticIndex() {
  const navigate = useNavigate();

  // Redirect to the missions page on load
  useEffect(() => {
    navigate('/government/diplomatic/missions');
  }, [navigate]);

  return (
    <div className='flex items-center justify-center h-64'>
      <div className='text-center'>
        <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4'></div>
        <p className='text-gray-800'>Loading diplomatic data...</p>
      </div>
    </div>
  );
}
