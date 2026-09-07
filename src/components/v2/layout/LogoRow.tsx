import { FC, FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MailIcon, MenuIcon, SearchIcon, XIcon } from 'lucide-react';
import Button from '../ui/Button';
import {
  COAT_OF_ARMS_ALT,
  COAT_OF_ARMS_SRC,
  SITE_NAME,
  SITE_OWNER,
} from '../../../lib/brand';

type Props = {
  isMobileOpen: boolean;
  onToggleMobile: () => void;
};

const LogoRow: FC<Props> = ({ isMobileOpen, onToggleMobile }) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Global search — always lands on /search, with ?q= when something was typed.
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-8 py-6 max-md:grid-cols-[auto_auto] max-md:justify-between max-md:gap-3 max-md:py-3'>
      <Link
        to='/'
        aria-label={`${SITE_NAME} home`}
        className='inline-flex items-center gap-3 no-underline'
      >
        <img
          src={COAT_OF_ARMS_SRC}
          alt={COAT_OF_ARMS_ALT}
          className='block h-14 w-auto max-md:h-10'
        />
        <span className='block'>
          <span className='block font-serif-ed text-2xl font-bold leading-none text-ed-navy-ink max-md:text-xl'>
            {SITE_NAME}
          </span>
          <span className='mt-1 block font-sans-ed text-[11px] leading-tight text-ed-ink-3 max-md:mt-0.5 max-md:text-[10px]'>
            {SITE_OWNER}
          </span>
        </span>
      </Link>

      {/* Tagline is desktop-only — below xl it gets crushed into a narrow
          column and forces the search/button group to wrap. */}
      <div className='border-l border-ed-rule pl-6 font-mono-ed text-[10px] uppercase leading-tight tracking-[0.16em] text-ed-ink-3 max-w-[320px] max-xl:hidden'>
        {t(
          'masthead.tagline',
          'The official website of the Republic of the Philippines'
        )}
      </div>

      <div className='flex items-center gap-3.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
        <form
          role='search'
          onSubmit={handleSearch}
          className='relative max-md:hidden'
        >
          <SearchIcon
            size={15}
            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ed-ink-3'
          />
          <input
            type='search'
            name='q'
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label={t('masthead.search', 'Search')}
            placeholder={t(
              'masthead.searchPlaceholder',
              'Search services, agencies, and more'
            )}
            className='h-11 w-[220px] border border-ed-rule-strong bg-white pl-9 pr-3 font-sans-ed text-sm normal-case tracking-normal text-ed-ink outline-none placeholder:text-ed-ink-4 focus:border-ed-navy focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ed-navy lg:w-[300px] xl:w-[340px]'
          />
        </form>
        {/* Below lg the Contact us button yields its space to the menu
            button; the contact link stays available in the top bar & menu. */}
        <Button as={Link} to='/contact' className='max-lg:hidden'>
          <MailIcon size={15} />
          <span>{t('masthead.contactUs', 'Contact us')}</span>
        </Button>

        <Button
          variant='ghost'
          size='sm'
          onClick={onToggleMobile}
          aria-label='Toggle menu'
          aria-expanded={isMobileOpen}
          className='lg:hidden'
        >
          {isMobileOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          <span>{t('masthead.menu', 'Menu')}</span>
        </Button>
      </div>
    </div>
  );
};

export default LogoRow;
