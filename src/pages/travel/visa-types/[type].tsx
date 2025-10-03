import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  SearchIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import visaData from '../../../data/visa/philippines_visa_types.json';
import { VisaType } from '@/types/visa.ts';
import { getCategoryIcon } from './visa.util';

interface VisaCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  visaTypes: VisaType[] | Array<Record<string, unknown>>;
}

interface VisaTypeDetailParams {
  type: string;
}

const VisaTypeDetail: React.FC = () => {
  const { type } = useParams<VisaTypeDetailParams>();
  const [visa, setVisa] = useState<VisaType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Use the categories from the consolidated JSON file
  const visaCategories: VisaCategory[] = visaData.categories.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    icon: getCategoryIcon(category.id),
    visaTypes: category.visaTypes,
  }));

  // Handle category selection
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Filter visa types based on search term
  const filteredVisaTypes =
    searchTerm.trim() === ''
      ? []
      : visaCategories.flatMap(category =>
          category.visaTypes.filter(
            visa =>
              visa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              visa.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

  useEffect(() => {
    setLoading(true);

    try {
      // Flatten all visa types from all categories to find the requested visa
      const allVisaTypes = visaData.categories.flatMap(
        category => category.visaTypes
      );

      // Find the visa by ID
      const foundVisa = allVisaTypes.find(v => v.id === type);

      if (foundVisa) {
        setVisa(foundVisa);

        // Find which category this visa belongs to
        const visaCategory = visaData.categories.find(category =>
          category.visaTypes.some(v => v.id === type)
        );

        if (visaCategory) {
          setSelectedCategory(visaCategory.id);
        }

        setError(null);
      } else {
        setError(`Visa type "${type}" not found`);
      }
    } catch (err) {
      setError('Failed to load visa information');
      console.error('Error loading visa data:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
          <p className='mt-4 text-gray-800'>Loading visa information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50'>
        {/* Hero Section */}
        <div className='bg-linear-to-r from-blue-600 to-indigo-700 text-white py-12'>
          <div className='container mx-auto max-w-6xl px-4'>
            <h1 className='text-3xl md:text-4xl font-bold mb-2'>
              Philippines Visa Types
            </h1>
            <p className='text-xl opacity-90 mb-6'>
              Explore different types of visas available for travel to the
              Philippines
            </p>

            {/* Search Box */}
            <div className='max-w-lg bg-white rounded-lg shadow-md flex items-center p-2'>
              <SearchIcon className='h-5 w-5 text-gray-400 ml-2' />
              <input
                type='text'
                placeholder='Search visa types...'
                className='flex-1 p-2 outline-hidden text-gray-800'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className='container mx-auto max-w-6xl px-4 py-8'>
          <div className='flex items-center text-red-600 mb-4'>
            <AlertCircleIcon className='h-6 w-6 mr-2' />
            <h2 className='text-xl font-semibold'>Error</h2>
          </div>
          <p className='text-gray-700'>{error}</p>
          <Link
            to='/travel/visa-types'
            className='mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
          >
            Return to Visa Types
          </Link>
        </div>
      </div>
    );
  }

  if (!visa) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Hero Section */}
      <div className='bg-linear-to-r from-blue-600 to-indigo-700 text-white py-12'>
        <div className='container mx-auto max-w-6xl px-4'>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>
            Philippines Visa Types
          </h1>
          <p className='text-xl opacity-90 mb-6'>
            Explore different types of visas available for travel to the
            Philippines
          </p>

          {/* Search Box */}
          <div className='max-w-lg bg-white rounded-lg shadow-md flex items-center p-2'>
            <SearchIcon className='h-5 w-5 text-gray-400 ml-2' />
            <input
              type='text'
              placeholder='Search visa types...'
              className='flex-1 p-2 outline-hidden text-gray-800'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className='container mx-auto max-w-6xl px-4 py-8'>
        {/* Search Results Display */}
        {searchTerm.trim() !== '' && (
          <div className='mb-6'>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>
              Showing results for: &ldquo;{searchTerm}&rdquo;
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredVisaTypes.map(
                (visa: {
                  id: string;
                  name: string;
                  [key: string]: unknown;
                }) => (
                  <Link
                    to={`/travel/visa-types/${visa.id}`}
                    key={visa.id}
                    className='bg-white rounded-lg shadow-xs border border-gray-200 hover:shadow-md transition-shadow duration-200'
                  >
                    <div className='p-4'>
                      <h3 className='font-semibold text-lg text-gray-800 mb-2 flex items-center justify-between'>
                        {visa.name}
                        <ChevronRightIcon className='h-5 w-5 text-blue-500' />
                      </h3>
                      <p className='text-gray-800 text-sm mb-3'>
                        {visa.description}
                      </p>
                    </div>
                  </Link>
                )
              )}
            </div>
          </div>
        )}

        {/* Main Content with Sidebar */}
        {searchTerm.trim() === '' && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {/* Sidebar */}
            <div className='md:col-span-1'>
              <div className='bg-white rounded-lg shadow-xs border border-gray-200 sticky top-4'>
                <div className='p-4 border-b border-gray-200'>
                  <h2 className='font-semibold text-lg text-gray-800'>
                    Visa Categories
                  </h2>
                </div>
                <nav className='p-2'>
                  {visaCategories.map(category => (
                    <Link
                      key={category.id}
                      to={`/travel/visa-types`}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`w-full text-left flex items-center p-3 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className='mr-3'>{category.icon}</span>
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className='md:col-span-3'>
              <div className='mb-4'>
                <Link
                  to='/travel/visa-types'
                  className='inline-flex items-center text-blue-600 hover:text-blue-800'
                >
                  <ArrowLeftIcon className='h-4 w-4 mr-1' />
                  Back to Visa Types
                </Link>
              </div>

              <div className='bg-white rounded-lg shadow-xs border border-gray-200'>
                <div className='p-6'>
                  <h2 className='text-2xl md:text-3xl font-bold text-gray-800 mb-2'>
                    {visa.name}
                  </h2>
                  <p className='text-lg text-gray-800 mb-6'>
                    {visa.description}
                  </p>

                  {/* Official Information */}
                  {visa.url && (
                    <div className='mb-8'>
                      <Link
                        to={visa.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
                      >
                        Official Information
                        <ExternalLinkIcon className='h-4 w-4 ml-1' />
                      </Link>
                    </div>
                  )}

                  {/* Minimum Requirements */}
                  {visa.minimumRequirements &&
                    visa.minimumRequirements.length > 0 && (
                      <div className='mb-8'>
                        <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                          Minimum Requirements
                        </h3>
                        <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                          <ul className='list-disc pl-5 text-gray-700 space-y-2'>
                            {visa.minimumRequirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  {/* Visa Subtypes */}
                  {visa.subtypes && visa.subtypes.length > 0 && (
                    <div className='mb-8'>
                      <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                        Visa Subtypes
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {visa.subtypes.map((subtype, index) => (
                          <div
                            key={index}
                            className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                          >
                            <h4 className='font-medium text-lg text-gray-800'>
                              {subtype.name}
                            </h4>
                            <p className='text-gray-800 text-sm mb-3'>
                              {subtype.description}
                            </p>

                            {Array.isArray(subtype.requirements) ? (
                              <>
                                <h5 className='text-sm font-medium text-gray-700 mt-2'>
                                  Requirements:
                                </h5>
                                <ul className='list-disc pl-5 text-sm text-gray-800'>
                                  {subtype.requirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <>
                                {subtype.requirements.businessOwners && (
                                  <>
                                    <h5 className='text-sm font-medium text-gray-700 mt-2'>
                                      For Business Owners:
                                    </h5>
                                    <ul className='list-disc pl-5 text-sm text-gray-800'>
                                      {subtype.requirements.businessOwners.map(
                                        (req, index) => (
                                          <li key={index}>{req}</li>
                                        )
                                      )}
                                    </ul>
                                  </>
                                )}

                                {subtype.requirements.employees && (
                                  <>
                                    <h5 className='text-sm font-medium text-gray-700 mt-2'>
                                      For Employees:
                                    </h5>
                                    <ul className='list-disc pl-5 text-sm text-gray-800'>
                                      {subtype.requirements.employees.map(
                                        (req, index) => (
                                          <li key={index}>{req}</li>
                                        )
                                      )}
                                    </ul>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className='bg-blue-50 border-t border-blue-200 p-4'>
                  <div className='flex items-start'>
                    <AlertCircleIcon className='h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0' />
                    <div>
                      <h3 className='font-medium text-blue-800'>
                        Important Notice
                      </h3>
                      <p className='text-sm text-blue-700 mt-1'>
                        This information is provided for reference only. For the
                        most accurate and up-to-date visa requirements, please
                        consult the official{' '}
                        <a
                          href='https://immigration.gov.ph/visas/'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='underline hover:text-blue-900'
                        >
                          Philippine Bureau of Immigration
                        </a>{' '}
                        or{' '}
                        <a
                          href='https://dfa.gov.ph/'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='underline hover:text-blue-900'
                        >
                          Department of Foreign Affairs
                        </a>{' '}
                        website.
                      </p>
                      <p className='text-sm text-blue-700 mt-2'>
                        Last updated: {visaData.sourceInfo.lastUpdated}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisaTypeDetail;
