import { FC, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from 'lucide-react';
import { mainNavigation } from '../../../data/navigation';
import Container from '../ui/Container';
import { cn } from '../../../lib/utils';

const navLinkBase =
  'inline-flex items-center gap-1.5 whitespace-nowrap px-[18px] py-3 font-serif-ed text-base font-medium text-ed-ink-2 no-underline transition-colors hover:bg-ed-navy-tint hover:text-ed-navy';

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
  const [hovered, setHovered] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const enter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(label);
  };

  const leave = () => {
    timeoutRef.current = setTimeout(() => setHovered(null), 90);
  };

  return (
    <nav
      className='border-t border-ed-rule border-b border-b-ed-navy bg-white max-[960px]:hidden'
      aria-label='Primary'
    >
      <Container className='flex items-stretch justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        <Link
          to='/'
          className={cn(
            navLinkBase,
            location.pathname === '/' &&
              'bg-ed-navy text-white hover:bg-ed-navy hover:text-white'
          )}
        >
          {t('navbar.home', 'Home')}
        </Link>
        {mainNavigation.map(item => {
          const active = isActivePath(location.pathname, item.href);
          const key = item.label.toLowerCase();
          const isOpen = hovered === item.label;
          return (
            <div
              key={item.label}
              className='relative'
              onMouseEnter={() => enter(item.label)}
              onMouseLeave={leave}
            >
              <Link
                to={item.href}
                className={cn(
                  navLinkBase,
                  active &&
                    'bg-ed-navy text-white hover:bg-ed-navy hover:text-white'
                )}
              >
                <span>{t(`navbar.${key}`, item.label)}</span>
                {item.children && (
                  <ChevronDownIcon size={12} className='opacity-70' />
                )}
              </Link>
              {item.children && isOpen && (
                <div
                  role='menu'
                  className='absolute left-[-1px] top-full z-[100] min-w-[420px] border border-ed-navy border-t-2 bg-white py-2 shadow-[0_12px_32px_rgba(8,40,110,0.14)]'
                >
                  {item.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      target={child.target}
                      role='menuitem'
                      onClick={leave}
                      className='block border-b border-ed-rule px-5 py-3.5 font-serif-ed text-base leading-snug text-ed-ink no-underline transition-colors last:border-b-0 hover:bg-ed-navy-tint'
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
      </Container>
    </nav>
  );
};

export default PrimaryNav;
