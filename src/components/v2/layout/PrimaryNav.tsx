import { FC, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';
import { mainNavigation } from '../../../data/navigation';
import Container from '../ui/Container';
import { cn } from '../../../lib/utils';

const navItemBase =
  'inline-flex items-center gap-1.5 whitespace-nowrap px-5 py-3 font-serif-ed text-base font-semibold text-ed-ink-2 no-underline transition-colors hover:bg-ed-navy-tint hover:text-ed-navy';

/**
 * Subtle tint — matches the hover treatment — used both for the current
 * route and for a dropdown whose menu is open.
 */
const activeClasses = 'bg-ed-navy-tint text-ed-navy';

const isActivePath = (pathname: string, href: string) => {
  if (!href) return false;
  const path = pathname.replace(/\/$/, '');
  const h = href.replace(/\/$/, '');
  if (h === '') return path === '';
  return path === h || path.startsWith(h + '/');
};

const PrimaryNav: FC = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const hoverCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  // Close dropdown when the route changes
  useEffect(() => {
    setOpenItem(null);
  }, [location.pathname, location.search]);

  // Click outside closes the dropdown
  useEffect(() => {
    if (!openItem) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenItem(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openItem]);

  // Escape closes the dropdown
  useEffect(() => {
    if (!openItem) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenItem(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [openItem]);

  useEffect(() => {
    return () => {
      if (hoverCloseRef.current) clearTimeout(hoverCloseRef.current);
    };
  }, []);

  const handleHoverEnter = (label: string) => {
    if (hoverCloseRef.current) {
      clearTimeout(hoverCloseRef.current);
      hoverCloseRef.current = null;
    }
    setOpenItem(label);
  };

  const handleHoverLeave = () => {
    if (hoverCloseRef.current) clearTimeout(hoverCloseRef.current);
    hoverCloseRef.current = setTimeout(() => setOpenItem(null), 120);
  };

  const toggle = (label: string) => {
    setOpenItem(openItem === label ? null : label);
  };

  return (
    <nav
      ref={rootRef}
      className='border-ed-rule bg-white max-lg:hidden'
      aria-label='Primary'
    >
      <Container className='flex items-stretch justify-start flex-wrap'>
        <Link
          to='/'
          className={cn(
            navItemBase,
            location.pathname === '/' && activeClasses
          )}
        >
          {t('navbar.home', 'Home')}
        </Link>

        {mainNavigation.map(item => {
          const active = isActivePath(location.pathname, item.href);
          const key = item.label.toLowerCase();
          const label = t(`navbar.${key}`, item.label);
          const isOpen = openItem === item.label;

          if (!item.children) {
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(navItemBase, active && activeClasses)}
              >
                {label}
              </Link>
            );
          }

          return (
            <div
              key={item.label}
              className='relative'
              onMouseEnter={() => handleHoverEnter(item.label)}
              onMouseLeave={handleHoverLeave}
            >
              <button
                type='button'
                onClick={() => toggle(item.label)}
                aria-haspopup='menu'
                aria-expanded={isOpen}
                className={cn(
                  navItemBase,
                  'cursor-pointer select-none border-0 bg-transparent',
                  (active || isOpen) && activeClasses
                )}
              >
                <span>{label}</span>
                <ChevronDownIcon
                  size={12}
                  className={cn(
                    'opacity-70 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
              {isOpen && (
                <div
                  role='menu'
                  className='absolute left-[-1px] top-full z-[100] min-w-[420px] border border-ed-navy border-t-2 bg-white py-2 shadow-[0_12px_32px_rgba(8,40,110,0.14)]'
                >
                  {/* First item: navigate to the parent section's landing page,
                      if it has one */}
                  {item.href && (
                    <Link
                      to={item.href}
                      role='menuitem'
                      onClick={() => setOpenItem(null)}
                      className='block bg-ed-navy-tint px-6 py-3 font-sans-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy-ink no-underline transition-colors hover:bg-ed-navy hover:text-white'
                    >
                      {label} overview →
                    </Link>
                  )}
                  {item.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      target={child.target}
                      role='menuitem'
                      onClick={() => setOpenItem(null)}
                      className='block px-6 py-3.5 font-serif-ed text-base leading-snug text-ed-ink no-underline transition-colors last:border-b-0 hover:bg-ed-navy-tint'
                    >
                      {child.blurb ? (
                        <>
                          <span className='block text-[17px] font-semibold text-ed-navy-ink'>
                            {child.label}
                          </span>
                          <span className='mt-0.5 block font-sans-ed text-xs normal-case text-ed-ink-3'>
                            {child.blurb}
                          </span>
                        </>
                      ) : (
                        child.label
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Pushed to the far right, styled the same as the section items */}
        <a
          href='https://e.gov.ph'
          target='_blank'
          rel='noopener noreferrer'
          className={cn(navItemBase, 'ml-auto max-xl:hidden')}
        >
          {t('navbar.downloadEgovApp', 'Download eGov App')}
        </a>
      </Container>
    </nav>
  );
};

export default PrimaryNav;
