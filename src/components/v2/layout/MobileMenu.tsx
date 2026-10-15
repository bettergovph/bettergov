import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import { mainNavigation } from '../../../data/navigation';
import Container from '../ui/Container';
import LangToggle from './LangToggle';
import { cn } from '../../../lib/utils';

type Props = {
  onClose: () => void;
};

const labelRow =
  'flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0 py-3.5 text-left font-sans-ed text-[15px] font-medium text-ed-ink no-underline';

const MobileMenu: FC<Props> = ({ onClose }) => {
  const { t } = useTranslation('common');
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className='border-b border-ed-ink bg-white px-0 py-2 pb-4 lg:hidden'>
      <Container>
        <Link to='/' onClick={onClose} className={labelRow}>
          <span>{t('navbar.home', 'Home')}</span>
        </Link>
        {mainNavigation.map(item => {
          const key = item.label.toLowerCase();
          const open = openItem === item.label;
          return (
            <div key={item.label} className='border-b border-ed-rule'>
              <button
                type='button'
                onClick={() => setOpenItem(open ? null : item.label)}
                className={labelRow}
              >
                <span>{t(`navbar.${key}`, item.label)}</span>
                {item.children && (
                  <ChevronDownIcon
                    size={14}
                    className={cn('transition-transform', open && 'rotate-180')}
                  />
                )}
              </button>
              {item.children && open && (
                <div className='ml-1 flex flex-col border-l-2 border-ed-rule py-1 pl-3'>
                  {item.href && (
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className='px-3.5 py-2 text-sm text-ed-ink-2 no-underline hover:text-ed-navy'
                    >
                      {t(`navbar.${key}`, item.label)} →
                    </Link>
                  )}
                  {item.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      target={child.target}
                      onClick={onClose}
                      className='px-3.5 py-2 text-sm text-ed-ink-2 no-underline hover:text-ed-navy'
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <Link to='/search' onClick={onClose} className={labelRow}>
          <span>{t('masthead.search', 'Search')}</span>
          <SearchIcon size={14} />
        </Link>

        {/* Utility links that live in the top bar on desktop. */}
        <nav
          aria-label='Utility'
          className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ed-rule pt-4 font-sans-ed text-sm text-ed-ink-2'
        >
          <Link
            to='/contact'
            onClick={onClose}
            className='text-ed-ink-2 no-underline hover:text-ed-navy'
          >
            {t('masthead.contact', 'Contact')}
          </Link>
          <Link
            to='/accessibility'
            onClick={onClose}
            className='text-ed-ink-2 no-underline hover:text-ed-navy'
          >
            {t('masthead.accessibility', 'Accessibility')}
          </Link>
          <Link
            to='/about'
            onClick={onClose}
            className='text-ed-ink-2 no-underline hover:text-ed-navy'
          >
            {t('masthead.about', 'About')}
          </Link>
        </nav>
        <div className='mt-3'>
          <LangToggle />
        </div>
      </Container>
    </div>
  );
};

export default MobileMenu;
