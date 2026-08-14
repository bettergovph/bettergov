import { useState, useEffect, useRef, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, GlobeIcon, SearchIcon } from 'lucide-react';
import visaData from '../../../data/visa/philippines_visa_policy.json';
import Flag from 'react-world-flags';
import { PhilippinesVisaPolicy, VisaRequirement } from '../../../types/visa';
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
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Button from '../../../components/v2/ui/Button';
import Flag2 from '../../../components/v2/ui/Flag';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';

// Direct country name to ISO2 code mapping for flags
const COUNTRY_TO_ISO2: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Andorra: 'AD',
  Angola: 'AO',
  'Antigua and Barbuda': 'AG',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Bahamas: 'BS',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Barbados: 'BB',
  Belarus: 'BY',
  Belgium: 'BE',
  Belize: 'BZ',
  Benin: 'BJ',
  Bhutan: 'BT',
  Bolivia: 'BO',
  'Bosnia and Herzegovina': 'BA',
  Botswana: 'BW',
  Brazil: 'BR',
  Brunei: 'BN',
  'Brunei Darussalam': 'BN',
  Bulgaria: 'BG',
  'Burkina Faso': 'BF',
  Burundi: 'BI',
  Cambodia: 'KH',
  Cameroon: 'CM',
  Canada: 'CA',
  'Cape Verde': 'CV',
  'Central African Republic': 'CF',
  Chad: 'TD',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  Comoros: 'KM',
  Congo: 'CG',
  'Costa Rica': 'CR',
  "Cote d'Ivoire": 'CI',
  Croatia: 'HR',
  Cuba: 'CU',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  'Democratic Republic of the Congo': 'CD',
  Denmark: 'DK',
  Djibouti: 'DJ',
  Dominica: 'DM',
  'Dominican Republic': 'DO',
  Ecuador: 'EC',
  Egypt: 'EG',
  'El Salvador': 'SV',
  'Equatorial Guinea': 'GQ',
  Eritrea: 'ER',
  Eritre: 'ER',
  Estonia: 'EE',
  Ethiopia: 'ET',
  Fiji: 'FJ',
  Finland: 'FI',
  France: 'FR',
  Gabon: 'GA',
  Gambia: 'GM',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Grenada: 'GD',
  Guatemala: 'GT',
  Guinea: 'GN',
  'Guinea Bissau': 'GW',
  Guyana: 'GY',
  Haiti: 'HT',
  Honduras: 'HN',
  'Hong Kong': 'HK',
  Hungary: 'HU',
  Iceland: 'IS',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Jamaica: 'JM',
  Japan: 'JP',
  Jordan: 'JO',
  Kazakhstan: 'KZ',
  Kenya: 'KE',
  Kiribati: 'KI',
  Kuwait: 'KW',
  Kyrgyzstan: 'KG',
  "Lao People's Democratic Republic": 'LA',
  Latvia: 'LV',
  Lebanon: 'LB',
  Lesotho: 'LS',
  Liberia: 'LR',
  Libya: 'LY',
  Liechtenstein: 'LI',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Madagascar: 'MG',
  Malawi: 'MW',
  Malaysia: 'MY',
  Maldives: 'MV',
  Mali: 'ML',
  Malta: 'MT',
  'Marshall Islands': 'MH',
  Mauritania: 'MR',
  Mauritius: 'MU',
  Mexico: 'MX',
  Micronesia: 'FM',
  Moldova: 'MD',
  Monaco: 'MC',
  Mongolia: 'MN',
  Montenegro: 'ME',
  Morocco: 'MA',
  Mozambique: 'MZ',
  Myanmar: 'MM',
  Namibia: 'NA',
  Nepal: 'NP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nicaragua: 'NI',
  Niger: 'NE',
  Nigeria: 'NG',
  'North Korea': 'KP',
  Norway: 'NO',
  Oman: 'OM',
  Pakistan: 'PK',
  Palau: 'PW',
  Palestine: 'PS',
  Panama: 'PA',
  'Papua New Guinea': 'PG',
  Paraguay: 'PY',
  Peru: 'PE',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  'Republic of Korea': 'KR',
  Romania: 'RO',
  Russia: 'RU',
  Rwanda: 'RW',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  Samoa: 'WS',
  'San Marino': 'SM',
  'Sao Tome and Principe': 'ST',
  'Saudi Arabia': 'SA',
  Senegal: 'SN',
  Serbia: 'RS',
  Seychelles: 'SC',
  Singapore: 'SG',
  'Slovak Republic': 'SK',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'Solomon Islands': 'SB',
  Somalia: 'SO',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'South Sudan': 'SS',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sudan: 'SD',
  Suriname: 'SR',
  Swaziland: 'SZ',
  Sweden: 'SE',
  Switzerland: 'CH',
  Syria: 'SY',
  Tajikistan: 'TJ',
  Thailand: 'TH',
  Togo: 'TG',
  'Trinidad and Tobago': 'TT',
  Tunisia: 'TN',
  Turkey: 'TR',
  Turkmenistan: 'TM',
  Tuvalu: 'TV',
  Uganda: 'UG',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United Kingdom of Great Britain and Northern Ireland': 'GB',
  'United Republic of Tanzania': 'TZ',
  'United States': 'US',
  'United States of America': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Vanuatu: 'VU',
  Vatican: 'VA',
  'Vatican City': 'VA',
  Venezuela: 'VE',
  Vietnam: 'VN',
  Yemen: 'YE',
  Zambia: 'ZM',
  Zimbabwe: 'ZW',
};

const getCountryIso2 = (countryName: string): string | undefined => {
  const key = countryName.trim();
  return COUNTRY_TO_ISO2[key] || COUNTRY_TO_ISO2[key.toLowerCase()];
};

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

const VisaPage: FC = () => {
  const { t } = useTranslation('visa');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useQueryState('country', {
    clearOnDefault: true,
  });
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
        // Auto-open dialog when country parameter is present in URL
        // Only open dialog in Grid View, not in Detail View (list mode)
        if (viewMode !== 'list') {
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
    setSelectedCountry(null);
  };

  const handleCheckVisaRequirements = () => {
    // Scroll to the search bar and focus it
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const statusVariant = (
    type: string
  ): 'navy' | 'red' | 'outline' | 'default' => {
    if (type === 'visa-free') return 'navy';
    if (type === 'visa-required') return 'red';
    if (type === 'special-condition') return 'outline';
    return 'default';
  };

  const statusLabel = (type: string, duration?: string) => {
    if (type === 'visa-free') return duration || 'Visa-free';
    if (type === 'visa-required') return 'Visa required';
    if (type === 'special-condition') return 'Special conditions';
    return type;
  };

  const isGrid = viewMode !== 'list';

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        eyebrow='§ Travel · Visa'
        title={
          <>
            {t('hero.title')}{' '}
            <em className='italic font-normal'>in plain terms.</em>
          </>
        }
        lede={t('hero.subtitle')}
      >
        <div className='mt-3 flex flex-wrap items-center gap-4 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-white/70'>
          <span className='inline-flex items-center gap-2'>
            <GlobeIcon size={14} />
            {t('hero.dataSource')}
          </span>
        </div>
        <div className='mt-6 flex flex-wrap gap-3'>
          <Button
            as='button'
            onClick={handleCheckVisaRequirements}
            variant='solid'
            className='!border-white !bg-white !text-ed-navy-ink hover:!bg-transparent hover:!text-white'
          >
            <SearchIcon size={14} />
            <span>Check visa requirements</span>
          </Button>
          <Button
            as={Link}
            to='/travel/visa-types'
            variant='ghost'
            className='!border-white !text-white hover:!bg-white hover:!text-ed-navy-ink'
          >
            <span>{t('hero.checkVisaTypes')}</span>
            <ArrowRightIcon size={14} />
          </Button>
        </div>
      </PageMasthead>

      {/* Search + view toggle */}
      <section className='border-b border-ed-rule bg-white'>
        <Container className='grid grid-cols-[1fr_auto] items-center gap-4 py-5 max-lg:grid-cols-1 max-lg:gap-3'>
          <div className='relative'>
            <SearchIcon
              size={16}
              className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ed-ink-4'
            />
            <input
              ref={searchInputRef}
              type='search'
              placeholder={t('quickCheck.searchPlaceholder')}
              aria-label={t('quickCheck.searchAriaLabel')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='block w-full border border-ed-ink bg-white py-3 pl-10 pr-4 font-sans-ed text-[15px] text-ed-ink outline-none placeholder:text-ed-ink-4'
            />
          </div>
          <div className='inline-flex border border-ed-ink'>
            <button
              type='button'
              onClick={() => setViewMode('grid')}
              aria-pressed={isGrid}
              className={cn(
                'px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] transition-colors',
                isGrid
                  ? 'bg-ed-ink text-white'
                  : 'bg-white text-ed-ink hover:bg-ed-paper-2'
              )}
            >
              Grid
            </button>
            <button
              type='button'
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={cn(
                'border-l border-ed-ink px-4 py-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] transition-colors',
                viewMode === 'list'
                  ? 'bg-ed-ink text-white'
                  : 'bg-white text-ed-ink hover:bg-ed-paper-2'
              )}
            >
              Detail
            </button>
          </div>
        </Container>
      </section>

      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between'>
            <Eyebrow>
              {filteredCountries.length} of {allCountries.length} countries
            </Eyebrow>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-navy no-underline hover:text-ed-red'
              >
                Clear search
              </button>
            )}
          </div>

          {isGrid ? (
            filteredCountries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className='grid grid-cols-4 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1'>
                {filteredCountries.map(country => {
                  const requirement = countryRequirements.get(country);
                  const iso2 = getCountryIso2(country);
                  return (
                    <button
                      key={country}
                      type='button'
                      onClick={() => openDetailsDialog(country)}
                      className='group flex items-stretch border border-ed-rule bg-white text-left transition-colors hover:border-ed-ink'
                    >
                      <div className='h-24 w-20 shrink-0 overflow-hidden border-r border-ed-rule bg-ed-paper-2'>
                        {iso2 && (
                          <Flag
                            code={iso2}
                            title={country}
                            alt={country}
                            loading='lazy'
                            draggable={false}
                            className='block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105'
                          />
                        )}
                      </div>
                      <div className='flex flex-1 flex-col justify-center px-4 py-3'>
                        <h3 className='font-serif-ed text-base font-semibold leading-tight text-ed-navy-ink'>
                          {country}
                        </h3>
                        {requirement && (
                          <div className='mt-2'>
                            <Flag2 variant={statusVariant(requirement.type)}>
                              {statusLabel(
                                requirement.type,
                                requirement.duration
                              )}
                            </Flag2>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className='grid grid-cols-[minmax(260px,340px)_1fr] gap-10 max-lg:grid-cols-1 max-lg:gap-6'>
              <aside>
                <div className='mb-3'>
                  <Eyebrow>{t('countryList.title')}</Eyebrow>
                </div>
                <div
                  role='listbox'
                  aria-label={t('countryList.ariaLabel')}
                  className='max-h-[70vh] overflow-y-auto border border-ed-rule bg-white'
                >
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map(country => (
                      <button
                        key={country}
                        role='option'
                        aria-selected={selectedCountry === country}
                        onClick={() => checkVisaRequirement(country)}
                        className={cn(
                          'flex w-full items-center justify-between border-b border-ed-rule px-4 py-2.5 text-left font-serif-ed text-[15px] last:border-b-0 transition-colors',
                          selectedCountry === country
                            ? 'bg-ed-navy text-white'
                            : 'text-ed-ink hover:bg-ed-navy-tint'
                        )}
                      >
                        <span>{country}</span>
                      </button>
                    ))
                  ) : (
                    <div className='p-6 text-center text-ed-ink-3'>
                      <SearchIcon
                        size={24}
                        className='mx-auto mb-2 opacity-60'
                      />
                      <p className='text-sm'>{t('countryList.noResults')}</p>
                    </div>
                  )}
                </div>
              </aside>

              <div>
                {selectedCountry && visaRequirement ? (
                  <>
                    <h2 className='mb-5 border-b border-ed-navy pb-3 font-serif-ed text-[32px] font-semibold leading-tight text-ed-navy-ink'>
                      {t('requirements.title', { country: selectedCountry })}
                    </h2>
                    <VisaRequirementDetails
                      country={selectedCountry}
                      visaRequirement={visaRequirement}
                    />
                  </>
                ) : (
                  <div className='flex min-h-[280px] flex-col items-center justify-center border border-dashed border-ed-rule p-10 text-center'>
                    <GlobeIcon
                      size={40}
                      className='mb-4 text-ed-ink-3'
                      aria-hidden
                    />
                    <h2 className='font-serif-ed text-[24px] font-semibold text-ed-navy-ink'>
                      {t('defaultMessage.title')}
                    </h2>
                    <p className='mt-2 max-w-md text-sm text-ed-ink-2'>
                      {t('defaultMessage.description')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => !open && closeDetailsDialog()}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto font-sans-ed'>
          <DialogHeader>
            <DialogTitle className='font-serif-ed text-[26px] font-semibold text-ed-navy-ink'>
              {dialogCountry &&
                t('requirements.title', { country: dialogCountry })}
            </DialogTitle>
          </DialogHeader>
          {dialogCountry && visaRequirement && (
            <VisaRequirementDetails
              country={dialogCountry}
              visaRequirement={visaRequirement}
              isDialog
            />
          )}
          <DialogFooter>
            <Button as='button' onClick={closeDetailsDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

const EmptyState: FC = () => (
  <div className='border border-dashed border-ed-rule py-16 text-center text-ed-ink-3'>
    <SearchIcon size={28} className='mx-auto mb-3 opacity-60' />
    <div className='font-serif-ed text-[22px] text-ed-ink-2'>
      No countries match.
    </div>
    <p className='mt-1 text-sm'>Try a different term.</p>
  </div>
);

export default VisaPage;
