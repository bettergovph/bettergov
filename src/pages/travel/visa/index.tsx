import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  FileCheck,
  Globe,
  Search,
  AlertCircle,
  ExternalLink,
  Grid3x3,
  List,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import visaData from '../../../data/visa/philippines_visa_policy.json';
import { PhilippinesVisaPolicy, VisaRequirement } from '../../../types/visa';
import Button from '../../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useQueryState } from 'nuqs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/Dialog';

type Country = string;

// Using the imported VisaRequirement type from '../../../types/visa'

const VisaPage: React.FC = () => {
  const { t } = useTranslation('visa');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useQueryState('country');
  const [viewMode, setViewMode] = useQueryState('view', {
    defaultValue: 'list',
  });
  const [visaRequirement, setVisaRequirement] =
    useState<VisaRequirement | null>(null);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [countryRequirements, setCountryRequirements] = useState<
    Map<string, VisaRequirement>
  >(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCountry, setDialogCountry] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Extract all unique countries from the visa data
    const countries = new Set<string>();
    const requirements = new Map<string, VisaRequirement>();

    // Add countries with 30-day visa-free entry
    const typedVisaData = visaData as PhilippinesVisaPolicy;

    // Add countries with 30-day visa-free entry
    typedVisaData.visaFreeEntryPolicies[0].countries?.forEach(country => {
      countries.add(country);
      requirements.set(country, {
        type: 'visa-free',
        duration: '30 days',
        description: typedVisaData.visaFreeEntryPolicies[0].description,
      });
    });

    // Add countries with 59-day visa-free entry
    typedVisaData.visaFreeEntryPolicies[1].countries?.forEach(country => {
      countries.add(country);
      requirements.set(country, {
        type: 'visa-free',
        duration: '59 days',
        description: typedVisaData.visaFreeEntryPolicies[1].description,
      });
    });

    // Special case for India
    countries.add('India');
    requirements.set('India', {
      type: 'special-condition',
      duration: '14 days (extendable to 21 days)',
      description: typedVisaData.visaFreeEntryPolicies[2].description,
      requirements: typedVisaData.visaFreeEntryPolicies[2].requirements,
      additionalInfo: typedVisaData.visaFreeEntryPolicies[2].additionalInfo,
    });

    // Special case for China
    countries.add('China');
    requirements.set('China', {
      type: 'special-condition',
      duration: '7 days (extendable to 21 days)',
      description: typedVisaData.visaFreeEntryPolicies[3].description,
      additionalInfo: typedVisaData.visaFreeEntryPolicies[3].additionalInfo,
    });

    // Add some example visa-required countries
    [
      'Afghanistan',
      'Albania',
      'Algeria',
      'Armenia',
      'Azerbaijan',
      'Bangladesh',
      'Belarus',
      'Bosnia and Herzegovina',
      'Cuba',
      'Egypt',
      'Georgia',
      'Iran',
      'Iraq',
      'Jordan',
      'Lebanon',
      'Libya',
      'Moldova',
      'Montenegro',
      'Nigeria',
      'North Korea',
      'Pakistan',
      'Palestine',
      'Serbia',
      'Somalia',
      'South Sudan',
      'Sudan',
      'Syria',
      'Ukraine',
      'Yemen',
    ].forEach(country => {
      if (!countries.has(country)) {
        countries.add(country);
        requirements.set(country, {
          type: 'visa-required',
          description: typedVisaData.visaRequiredNationals.description,
        });
      }
    });

    const sortedCountries = Array.from(countries).sort();
    setAllCountries(sortedCountries);
    setFilteredCountries(sortedCountries);
    setCountryRequirements(requirements);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCountries(allCountries);
    } else {
      const filtered = allCountries.filter(country =>
        country.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm, allCountries]);

  const checkVisaRequirement = (country: string) => {
    setSelectedCountry(country);
    const requirement = countryRequirements.get(country);
    if (requirement) {
      setVisaRequirement(requirement);
    }
  };

  const openDetailsDialog = (country: string) => {
    setDialogCountry(country);
    const requirement = countryRequirements.get(country);
    if (requirement) {
      setVisaRequirement(requirement);
    }
    setDialogOpen(true);
  };

  const handleCheckVisaRequirements = () => {
    // Scroll to the search bar and focus it
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'visa-free':
        return <CheckCircle className='h-5 w-5 text-green-600' />;
      case 'visa-required':
        return <XCircle className='h-5 w-5 text-red-600' />;
      case 'special-condition':
        return <Clock className='h-5 w-5 text-yellow-600' />;
      default:
        return null;
    }
  };

  const getStatusBadge = (type: string, duration?: string) => {
    switch (type) {
      case 'visa-free':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            {duration || 'Visa Free'}
          </span>
        );
      case 'visa-required':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Visa Required
          </span>
        );
      case 'special-condition':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            Special Conditions
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className='bg-gray-50'>
      {/* Hero Section */}
      <div className='bg-linear-to-r from-blue-600 to-indigo-700 text-white py-16 px-4'>
        <div className='container mx-auto max-w-6xl'>
          <div className='flex flex-col md:flex-row items-center justify-between'>
            <div className='md:w-1/2 mb-8 md:mb-0'>
              <h1 className='text-4xl md:text-5xl font-bold mb-4'>
                {t('hero.title')}
              </h1>
              <p className='text-xl opacity-90 mb-6'>{t('hero.subtitle')}</p>
              <div className='flex items-center space-x-2 text-sm'>
                <Globe className='h-4 w-4' />
                <span>{t('hero.dataSource')}</span>
              </div>
              <Link to='/travel/visa-types'>
                <Button className='text-xl bg-blue-800 py-8 px-8 mt-6'>
                  {t('hero.checkVisaTypes')}
                </Button>
              </Link>
            </div>
            <div className='self-start md:w-1/3'>
              <div className='bg-white rounded-lg shadow-lg p-6 text-gray-800'>
                <h2 className='text-xl font-semibold mb-4 flex items-center'>
                  <Compass className='mr-2 h-5 w-5 text-blue-600' />
                  {t('quickCheck.title')}
                </h2>
                <p className='text-sm text-gray-800 mb-4'>
                  {t('quickCheck.description')}
                </p>
                <Button
                  onClick={handleCheckVisaRequirements}
                  className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                >
                  Check Visa Requirements
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto max-w-6xl py-4 md:py-12 px-4'>
        {/* View Toggle and Search Bar */}
        <div className='bg-white rounded-lg shadow-md p-4 mb-6'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <div className='relative w-full md:w-96'>
              <Search className='absolute left-3 top-3 h-5 w-5 text-gray-400' />
              <input
                ref={searchInputRef}
                type='text'
                placeholder={t('quickCheck.searchPlaceholder')}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label={t('quickCheck.searchAriaLabel')}
              />
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className='h-4 w-4' />
                Grid View
              </button>
              <button
                onClick={() => setViewMode('detail')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'detail'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className='h-4 w-4' />
                Detail View
              </button>
            </div>
          </div>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-2xl font-semibold mb-6'>
              Visa Requirements by Country
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filteredCountries.map(country => {
                const requirement = countryRequirements.get(country);
                return (
                  <div
                    key={country}
                    className='border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer'
                    onClick={() => openDetailsDialog(country)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='font-medium text-lg mb-2'>{country}</h3>
                        {requirement && (
                          <div className='flex items-center gap-2'>
                            {getStatusIcon(requirement.type)}
                            {getStatusBadge(
                              requirement.type,
                              requirement.duration
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredCountries.length === 0 && (
              <div className='text-center py-12 text-gray-500'>
                <Search className='mx-auto h-12 w-12 mb-4 opacity-50' />
                <p className='text-lg'>
                  No countries found matching your search.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Detail View */}
        {viewMode === 'detail' && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            {/* Left Column - Country List (Desktop Only) */}
            <div className='hidden xl:block xl:col-span-1'>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h2 className='text-xl font-semibold mb-4'>
                  {t('countryList.title')}
                </h2>
                <div
                  className='h-[800px] overflow-y-auto pr-2'
                  role='listbox'
                  aria-label={t('countryList.ariaLabel')}
                >
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <button
                        key={country}
                        className={`w-full text-left px-4 py-3 rounded-md mb-1 transition-colors ${
                          selectedCountry === country
                            ? 'bg-blue-100 text-blue-800 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => checkVisaRequirement(country)}
                        role='option'
                        aria-selected={selectedCountry === country}
                      >
                        {country}
                      </button>
                    ))
                  ) : (
                    <div className='text-center py-8 text-gray-800'>
                      <Search className='mx-auto h-8 w-8 mb-2 opacity-50' />
                      <p>{t('countryList.noResults')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Visa Requirements */}
            <div className='md:col-span-2'>
              <div className={`${!selectedCountry ? 'hidden xl:block' : ''}`}>
                {selectedCountry ? (
                  <div className='bg-white rounded-lg shadow-md p-6'>
                    <h2 className='text-2xl font-semibold mb-2'>
                      {t('requirements.title', { country: selectedCountry })}
                    </h2>

                    {visaRequirement && (
                      <div className='mt-6'>
                        {visaRequirement.type === 'visa-free' && (
                          <div className='flex items-start p-4 bg-green-50 border border-green-200 rounded-lg'>
                            <FileCheck className='h-6 w-6 text-green-600 mr-3 mt-0.5' />
                            <div>
                              <h3 className='font-semibold text-green-800'>
                                {t('requirements.visaFree.title')}
                              </h3>
                              <p className='text-green-700'>
                                {t('requirements.visaFree.description', {
                                  country: selectedCountry,
                                  duration: visaRequirement.duration,
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {visaRequirement.type === 'visa-required' && (
                          <div className='flex items-start p-4 bg-red-50 border border-red-200 rounded-lg'>
                            <AlertCircle className='h-6 w-6 text-red-600 mr-3 mt-0.5' />
                            <div>
                              <h3 className='font-semibold text-red-800'>
                                {t('requirements.visaRequired.title')}
                              </h3>
                              <p className='text-red-700'>
                                {t('requirements.visaRequired.description', {
                                  country: selectedCountry,
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {visaRequirement.type === 'special-condition' && (
                          <div className='flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                            <AlertCircle className='h-6 w-6 text-yellow-600 mr-3 mt-0.5' />
                            <div>
                              <h3 className='font-semibold text-yellow-800'>
                                {t('requirements.specialCondition.title')}
                              </h3>
                              <p className='text-yellow-700'>
                                {t(
                                  'requirements.specialCondition.description',
                                  {
                                    country: selectedCountry,
                                    duration: visaRequirement.duration,
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className='mt-6'>
                          <h3 className='text-lg font-medium mb-2'>
                            {t('requirements.entryRequirements')}
                          </h3>
                          <div className='prose prose-sm max-w-none'>
                            <p>{visaRequirement.description}</p>

                            {visaRequirement.requirements && (
                              <div className='mt-4'>
                                <h4 className='text-md font-medium mb-2'>
                                  {t('requirements.requiredDocuments')}
                                </h4>
                                <ul className='list-disc pl-5 space-y-1'>
                                  {visaRequirement.requirements.map(
                                    (req, index) => (
                                      <li key={index}>{req}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {visaRequirement.additionalInfo && (
                              <div className='mt-4 p-3 bg-blue-50 rounded-md text-blue-800'>
                                <p>
                                  <strong>{t('requirements.note')}</strong>{' '}
                                  {visaRequirement.additionalInfo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {visaRequirement.type === 'visa-required' && (
                          <div className='mt-6'>
                            <h3 className='text-lg font-medium mb-3'>
                              {t('visaApplication.title')}
                            </h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <a
                                href='https://evisa.gov.ph/'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                              >
                                <div className='rounded-full bg-blue-100 p-2 mr-3'>
                                  <Globe className='h-5 w-5 text-blue-600' />
                                </div>
                                <div>
                                  <h4 className='font-medium'>
                                    {t('visaApplication.eVisa.title')}
                                  </h4>
                                  <p className='text-sm text-gray-800'>
                                    {t('visaApplication.eVisa.description')}
                                  </p>
                                  <div className='flex items-center text-blue-600 text-sm mt-1'>
                                    <span>
                                      {t('visaApplication.eVisa.action')}
                                    </span>
                                    <ExternalLink className='h-3 w-3 ml-1' />
                                  </div>
                                </div>
                              </a>
                              <a
                                href='https://dfa.gov.ph/list-of-philippine-embassies-and-consulates-general'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                              >
                                <div className='rounded-full bg-blue-100 p-2 mr-3'>
                                  <Globe className='h-5 w-5 text-blue-600' />
                                </div>
                                <div>
                                  <h4 className='font-medium'>
                                    {t('visaApplication.embassy.title')}
                                  </h4>
                                  <p className='text-sm text-gray-800'>
                                    {t('visaApplication.embassy.description')}
                                  </p>
                                  <div className='flex items-center text-blue-600 text-sm mt-1'>
                                    <span>
                                      {t('visaApplication.embassy.action')}
                                    </span>
                                    <ExternalLink className='h-3 w-3 ml-1' />
                                  </div>
                                </div>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='bg-white rounded-lg shadow-md p-6 h-full'>
                    <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                      <div className='bg-blue-100 p-4 rounded-full mb-4'>
                        <Globe className='h-12 w-12 text-blue-600' />
                      </div>
                      <h2 className='text-2xl font-semibold mb-2'>
                        {t('defaultMessage.title')}
                      </h2>
                      <p className='text-gray-800 max-w-md mx-auto'>
                        {t('defaultMessage.description')}
                      </p>
                    </div>
                  </div>
                )}
                {selectedCountry && (
                  <div className='mt-8 bg-white rounded-lg shadow-md p-6'>
                    <h2 className='text-xl font-semibold mb-4'>
                      {t('additionalInfo.title')}
                    </h2>

                    <div className='space-y-6'>
                      <div>
                        <h3 className='text-lg font-medium mb-2'>
                          {t('additionalInfo.temporaryVisa.title')}
                        </h3>
                        <p className='text-gray-700'>
                          {t('additionalInfo.temporaryVisa.description')}
                        </p>
                        <a
                          href='https://evisa.gov.ph/page/policy?l1=Non-Immigrant%20Visas&l2=9(a)%20Temporary%20Visitors%20Visa'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center text-blue-600 hover:text-blue-800 mt-2'
                        >
                          <span>
                            {t('additionalInfo.temporaryVisa.learnMore')}
                          </span>
                          <ExternalLink className='h-3 w-3 ml-1' />
                        </a>
                      </div>

                      <div>
                        <h3 className='text-lg font-medium mb-2'>
                          {t('additionalInfo.visaExtensions.title')}
                        </h3>
                        <p className='text-gray-700'>
                          {t('additionalInfo.visaExtensions.description')}
                        </p>
                        <a
                          href='https://immigration.gov.ph/'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center text-blue-600 hover:text-blue-800 mt-2'
                        >
                          <span>
                            {t('additionalInfo.visaExtensions.visitWebsite')}
                          </span>
                          <ExternalLink className='h-3 w-3 ml-1' />
                        </a>
                      </div>

                      <div className='p-4 bg-yellow-50 rounded-lg'>
                        <h3 className='text-lg font-medium mb-2 text-yellow-800'>
                          {t('additionalInfo.disclaimer.title')}
                        </h3>
                        <p className='text-yellow-700 text-sm'>
                          {visaData.sourceInfo.disclaimer}
                        </p>
                        <p className='text-yellow-700 text-sm mt-2'>
                          Last updated: {visaData.sourceInfo.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visa Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl'>
              {dialogCountry &&
                t('requirements.title', { country: dialogCountry })}
            </DialogTitle>
          </DialogHeader>
          {dialogCountry && visaRequirement && (
            <div className='mt-4'>
              {visaRequirement.type === 'visa-free' && (
                <div className='flex items-start p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <FileCheck className='h-6 w-6 text-green-600 mr-3 mt-0.5' />
                  <div>
                    <h4 className='font-semibold text-green-800'>
                      {t('requirements.visaFree.title')}
                    </h4>
                    <p className='text-green-700'>
                      {t('requirements.visaFree.description', {
                        country: dialogCountry,
                        duration: visaRequirement.duration,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {visaRequirement.type === 'visa-required' && (
                <div className='flex items-start p-4 bg-red-50 border border-red-200 rounded-lg'>
                  <AlertCircle className='h-6 w-6 text-red-600 mr-3 mt-0.5' />
                  <div>
                    <h4 className='font-semibold text-red-800'>
                      {t('requirements.visaRequired.title')}
                    </h4>
                    <p className='text-red-700'>
                      {t('requirements.visaRequired.description', {
                        country: dialogCountry,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {visaRequirement.type === 'special-condition' && (
                <div className='flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                  <AlertCircle className='h-6 w-6 text-yellow-600 mr-3 mt-0.5' />
                  <div>
                    <h4 className='font-semibold text-yellow-800'>
                      {t('requirements.specialCondition.title')}
                    </h4>
                    <p className='text-yellow-700'>
                      {t('requirements.specialCondition.description', {
                        country: dialogCountry,
                        duration: visaRequirement.duration,
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className='mt-6'>
                <h4 className='text-lg font-medium mb-2'>
                  {t('requirements.entryRequirements')}
                </h4>
                <div className='prose prose-sm max-w-none'>
                  <p>{visaRequirement.description}</p>

                  {visaRequirement.requirements && (
                    <div className='mt-4'>
                      <h5 className='text-md font-medium mb-2'>
                        {t('requirements.requiredDocuments')}
                      </h5>
                      <ul className='list-disc pl-5 space-y-1'>
                        {visaRequirement.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {visaRequirement.additionalInfo && (
                    <div className='mt-4 p-3 bg-blue-50 rounded-md text-blue-800'>
                      <p>
                        <strong>{t('requirements.note')}</strong>{' '}
                        {visaRequirement.additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {visaRequirement.type === 'visa-required' && (
                <div className='mt-6'>
                  <h4 className='text-lg font-medium mb-3'>
                    {t('visaApplication.title')}
                  </h4>
                  <div className='grid grid-cols-1 gap-4'>
                    <a
                      href='https://evisa.gov.ph/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <div className='rounded-full bg-blue-100 p-2 mr-3'>
                        <Globe className='h-5 w-5 text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <h5 className='font-medium'>
                          {t('visaApplication.eVisa.title')}
                        </h5>
                        <p className='text-sm text-gray-600'>
                          {t('visaApplication.eVisa.description')}
                        </p>
                      </div>
                      <ExternalLink className='h-4 w-4 text-blue-600' />
                    </a>
                    <a
                      href='https://dfa.gov.ph/list-of-philippine-embassies-and-consulates-general'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <div className='rounded-full bg-blue-100 p-2 mr-3'>
                        <Globe className='h-5 w-5 text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <h5 className='font-medium'>
                          {t('visaApplication.embassy.title')}
                        </h5>
                        <p className='text-sm text-gray-600'>
                          {t('visaApplication.embassy.description')}
                        </p>
                      </div>
                      <ExternalLink className='h-4 w-4 text-blue-600' />
                    </a>
                  </div>
                </div>
              )}

              {/* Important Visa Information */}
              <div className='mt-6 border-t pt-6'>
                <h4 className='text-lg font-medium mb-4'>
                  {t('additionalInfo.title')}
                </h4>

                <div className='space-y-4'>
                  <div>
                    <h5 className='font-medium mb-2'>
                      {t('additionalInfo.temporaryVisa.title')}
                    </h5>
                    <p className='text-sm text-gray-700'>
                      {t('additionalInfo.temporaryVisa.description')}
                    </p>
                    <a
                      href='https://evisa.gov.ph/page/policy?l1=Non-Immigrant%20Visas&l2=9(a)%20Temporary%20Visitors%20Visa'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2'
                    >
                      <span>{t('additionalInfo.temporaryVisa.learnMore')}</span>
                      <ExternalLink className='h-3 w-3 ml-1' />
                    </a>
                  </div>

                  <div>
                    <h5 className='font-medium mb-2'>
                      {t('additionalInfo.visaExtensions.title')}
                    </h5>
                    <p className='text-sm text-gray-700'>
                      {t('additionalInfo.visaExtensions.description')}
                    </p>
                    <a
                      href='https://immigration.gov.ph/'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2'
                    >
                      <span>
                        {t('additionalInfo.visaExtensions.visitWebsite')}
                      </span>
                      <ExternalLink className='h-3 w-3 ml-1' />
                    </a>
                  </div>

                  <div className='p-3 bg-yellow-50 rounded-lg'>
                    <h5 className='font-medium mb-2 text-yellow-800'>
                      {t('additionalInfo.disclaimer.title')}
                    </h5>
                    <p className='text-yellow-700 text-xs'>
                      {visaData.sourceInfo.disclaimer}
                    </p>
                    <p className='text-yellow-700 text-xs mt-2'>
                      Last updated: {visaData.sourceInfo.lastUpdated}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setDialogOpen(false)}
              className='bg-blue-600 hover:bg-blue-700 text-white'
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisaPage;
