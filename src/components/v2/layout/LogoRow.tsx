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
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-8 py-6 max-md:grid-cols-[auto_auto] max-md:justify-between max-md:gap-3'>
      <Link
        to='/'
        aria-label={`${SITE_NAME} home`}
        className='inline-flex items-center gap-3 no-underline'
      >
        <img
          src={COAT_OF_ARMS_SRC}
          alt={COAT_OF_ARMS_ALT}
          className='block h-14 w-auto'
        />
        <span className='block'>
          <span className='block font-serif-ed text-2xl font-bold leading-none text-ed-navy-ink'>
            {SITE_NAME}
          </span>
          <span className='mt-1 block font-sans-ed text-[11px] leading-tight text-ed-ink-3'>
            {SITE_OWNER}
          </span>
        </span>
      </Link>

      <div className='border-l border-ed-rule pl-6 font-mono-ed text-[10px] uppercase leading-tight tracking-[0.16em] text-ed-ink-3 max-w-[320px] max-md:hidden'>
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
            className='w-[300px] border border-ed-rule-strong bg-white py-2.5 pl-9 pr-3 font-sans-ed text-sm normal-case tracking-normal text-ed-ink outline-none placeholder:text-ed-ink-4 focus:border-ed-navy focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ed-navy xl:w-[340px]'
          />
        </form>
        <Button
          as={Link}
          to='/contact'
          variant='ghost'
          size='sm'
          className='max-md:hidden'
        >
          <MailIcon size={14} />
          <span>{t('masthead.contactUs', 'Contact us')}</span>
        </Button>

        <Button
          variant='ghost'
          size='sm'
          onClick={onToggleMobile}
          aria-label='Toggle menu'
          aria-expanded={isMobileOpen}
          className='md:hidden'
        >
          {isMobileOpen ? <XIcon size={16} /> : <MenuIcon size={16} />}
          <span>{t('masthead.menu', 'Menu')}</span>
        </Button>
      </div>
    </div>
  );
};

export default LogoRow;
