import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  Globe,
  Search,
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
import VisaRequirementDetails from '../../../components/travel/VisaRequirementDetails';

type Country = string;

// Example visa-required countries
const VISA_REQUIRED_COUNTRIES: Country[] = [
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
];

// Using the imported VisaRequirement type from '../../../types/visa'

const VisaPage: React.FC = () => {
  const { t } = useTranslation('visa');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useQueryState('country');
  const [viewMode, setViewMode] = useQueryState('view');
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

  // Set default view mode and ensure URL parameter is always present
  useEffect(() => {
    if (!viewMode) {
      setViewMode('grid');
    }
  }, [viewMode, setViewMode]);

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

    // Add visa-required countries
    VISA_REQUIRED_COUNTRIES.forEach(country => {
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

  // Restore state from URL parameters after data is loaded
  useEffect(() => {
    if (selectedCountry && countryRequirements.has(selectedCountry)) {
      const requirement = countryRequirements.get(selectedCountry);
      if (requirement) {
        setVisaRequirement(requirement);

        // Auto-open dialog in grid view
        if (viewMode === 'grid' || !viewMode) {
          setDialogCountry(selectedCountry);
          setDialogOpen(true);
        }
      }
    }
  }, [selectedCountry, countryRequirements, viewMode]);

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

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    const requirement = countryRequirements.get(country);
    if (requirement) {
      setVisaRequirement(requirement);
    }
  };

  const checkVisaRequirement = (country: string) => {
    selectCountry(country);
  };

  const openDetailsDialog = (country: string) => {
    selectCountry(country);
    setDialogCountry(country);
    setDialogOpen(true);
  };

  const closeDetailsDialog = () => {
    setDialogOpen(false);
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
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' || !viewMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={viewMode === 'grid' || !viewMode}
                aria-label='Switch to grid view'
              >
                <Grid3x3 className='h-4 w-4' />
                Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={viewMode === 'list'}
                aria-label='Switch to detail view'
              >
                <List className='h-4 w-4' />
                Detail View
              </button>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {(viewMode === 'grid' || !viewMode) && (
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-2xl font-semibold mb-6'>
              Visa Requirements by Country
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {filteredCountries.map(country => {
                const requirement = countryRequirements.get(country);
                return (
                  <div
                    key={country}
                    className='border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer'
                  >
                    <button
                      onClick={() => openDetailsDialog(country)}
                      className='w-full flex items-start justify-between p-4 cursor-pointer'
                    >
                      <div className='flex-1'>
                        <h3 className='font-medium text-lg text-left mb-2'>
                          {country}
                        </h3>
                        {requirement && (
                          <div className='flex items-start gap-2'>
                            {getStatusIcon(requirement.type)}
                            {getStatusBadge(
                              requirement.type,
                              requirement.duration
                            )}
                          </div>
                        )}
                      </div>
                    </button>
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
        {viewMode === 'list' && (
          <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
            {/* Left Column - Country List */}
            <div className='xl:col-span-1'>
              <div className='bg-white rounded-lg shadow-md p-6'>
                <h2 className='text-xl font-semibold mb-4'>
                  {t('countryList.title')}
                </h2>
                <div
                  className='max-h-[400px] xl:max-h-[800px] overflow-y-auto pr-2'
                  role='listbox'
                  aria-label={t('countryList.ariaLabel')}
                >
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <button
                        key={country}
                        className={`w-full text-left px-4 py-3 rounded-md mb-1 transition-colors cursor-pointer ${
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
            <div className='xl:col-span-2'>
              {selectedCountry ? (
                <div className='bg-white rounded-lg shadow-md p-6'>
                  <h2 className='text-2xl font-semibold mb-2'>
                    {t('requirements.title', { country: selectedCountry })}
                  </h2>

                  {visaRequirement && (
                    <VisaRequirementDetails
                      country={selectedCountry}
                      visaRequirement={visaRequirement}
                    />
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
            </div>
          </div>
        )}
      </div>

      {/* Visa Details Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => !open && closeDetailsDialog()}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl'>
              {dialogCountry &&
                t('requirements.title', { country: dialogCountry })}
            </DialogTitle>
          </DialogHeader>
          {dialogCountry && visaRequirement && (
            <VisaRequirementDetails
              country={dialogCountry}
              visaRequirement={visaRequirement}
              isDialog={true}
            />
          )}
          <DialogFooter>
            <Button
              onClick={closeDetailsDialog}
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
