import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MenuIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react';
import LangToggle from './LangToggle';
import Button from '../ui/Button';

type Props = {
  isMobileOpen: boolean;
  onToggleMobile: () => void;
};

const LogoRow: FC<Props> = ({ isMobileOpen, onToggleMobile }) => {
  const { t } = useTranslation('common');

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-center gap-6 py-3 max-md:grid-cols-[auto_auto] max-md:justify-between max-md:gap-3'>
      <Link
        to='/'
        aria-label='BetterGov.ph home'
        className='inline-flex items-center no-underline'
      >
        <img
          src='https://assets.bettergov.ph/logos/svg/horizontal-primary.svg'
          alt='BetterGov.ph'
          className='block h-9 w-auto'
        />
      </Link>

      <div className='border-l border-ed-rule pl-6 font-mono-ed text-[10px] uppercase leading-tight tracking-[0.16em] text-ed-ink-3 max-w-[320px] max-md:hidden'>
        {t('masthead.tagline', 'A community-run portal for the Philippines')}
      </div>

      <div className='flex items-center gap-3.5 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
        <div className='max-md:hidden'>
          <LangToggle />
        </div>
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
