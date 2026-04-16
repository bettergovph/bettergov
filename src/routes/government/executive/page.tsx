import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExecutiveIndex() {
  const navigate = useNavigate();

  // Redirect to the Office of the President page on load
  useEffect(() => {
    navigate('/government/executive/office-of-the-president');
  }, [navigate]);

  return (
    <div className='flex items-center justify-center h-64'>
      <div className='text-center'>
        <div className='animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4'></div>
        <p className='text-gray-800'>Loading executive branch data...</p>
      </div>
    </div>
  );
}
