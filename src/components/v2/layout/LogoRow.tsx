import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MenuIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react';
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

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-8 py-3 max-md:grid-cols-[auto_auto] max-md:justify-between max-md:gap-3'>
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
        <Button
          as={Link}
          to='/search'
          variant='ghost'
          size='sm'
          aria-label='Search'
          className='max-md:hidden'
        >
          <SearchIcon size={14} />
          <span>{t('masthead.search', 'Search')}</span>
        </Button>
        <Button
          as={Link}
          to='/join-us'
          variant='ghost'
          size='sm'
          className='max-md:hidden'
        >
          <UserIcon size={14} />
          <span>{t('masthead.joinUs', 'Join us')}</span>
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
