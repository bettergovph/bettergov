import { InfoIcon } from 'lucide-react';

const About = () => (
  <div className='bg-white rounded-lg shadow-md p-4'>
    <div>
      <div className='flex items-center mb-4'>
        <InfoIcon className='w-5 h-5 text-blue-600 mr-2' />
        <h2 className='text-lg font-semibold text-gray-800'>About This Data</h2>
      </div>
      <p className='text-gray-800 mb-4'>
        This map displays flood control infrastructure projects across the
        Philippines. Click on a region to filter projects by that area. Zoom in
        to see individual project locations. You can also use the filters to
        narrow down projects by year, type of work, and search terms.
      </p>
      <p className='text-gray-800 mb-2'>
        Additionally, the map incorporates Project NOAH flood hazard data:
      </p>
      <ul className='list-disc list-inside text-gray-800 mb-4'>
        <li>
          <span className='font-medium'>5-Year Flood</span>
        </li>
        <li>
          <span className='font-medium'>25-Year Flood</span>
        </li>
        <li>
          <span className='font-medium'>100-Year Flood</span>
        </li>
      </ul>
      <p className='text-gray-800'>
        These layers visualize flood-prone areas based on historical and modeled
        data, helping to understand potential flood risks in different regions.
        Visit{' '}
        <a
          href='https://noah.up.edu.ph/'
          target='_blank'
          rel='noreferrer'
          className='text-blue-600 hover:underline'
        >
          Project NOAH
        </a>{' '}
        to view high-resolution hazard maps on flooding, storm surge, and
        landslides.
      </p>
    </div>
    <p className='text-sm text-gray- mt-4'>
      Source: Department of Public Works and Highways (DPWH) Flood Control
      Information System, NOAH Studio
    </p>
  </div>
);

export default About;
