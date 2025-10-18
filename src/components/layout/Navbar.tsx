import {
  ChevronDownIcon,
  GlobeIcon,
  MenuIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { mainNavigation } from '../../data/navigation';
import { LANGUAGES } from '../../i18n/languages';
import { LanguageType } from '../../types';

const Navbar: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const { t, i18n } = useTranslation('common');
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setActiveMenu(null);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveMenu(null);
  };

  const toggleSubmenu = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  const changeLanguage = (newLanguage: LanguageType) => {
    i18n.changeLanguage(newLanguage);
  };

  const isActiveRoute = (href: string) => {
    // Handle edge cases: null, undefined, or empty href
    if (!href) return false;

    // Normalize paths by removing trailing slashes
    const normalizedPath = location.pathname.replace(/\/$/, '');
    const normalizedHref = href.replace(/\/$/, '');

    // Check exact match or if current path starts with href
    return (
      normalizedPath === normalizedHref ||
      (normalizedHref !== '/' &&
        normalizedPath.startsWith(normalizedHref + '/'))
    );
  };

  const handleDropdownMouseEnter = (label: string) => {
    setHoveredDropdown(label);
  };

  const handleDropdownMouseLeave = () => {
    setHoveredDropdown(null);
  };

  return (
    <nav className='bg-white shadow-xs sticky top-0 z-50'>
      {/* Top bar with language switcher and additional links */}
      <div className='border-b border-gray-200'>
        <div className='container mx-auto px-4 flex justify-end items-center h-10'>
          <div className='flex items-center space-x-4'>
            <Link
              to='/join-us'
              className='text-xs leading-12 text-primary-600 hover:text-primary-700 font-semibold transition-colors'
            >
              🚀 Join Us
            </Link>
            <Link
              to='/about'
              className='text-xs leading-12 text-gray-800 hover:text-primary-600 transition-colors'
            >
              About <span className='hidden md:inline'>BetterGov.ph</span>
            </Link>
            <a
              href='https://www.gov.ph'
              className='text-xs leading-12 text-gray-800 hover:text-primary-600 transition-colors'
              target='_blank'
              rel='noreferrer'
            >
              Official Gov.ph
            </a>

            <Link
              to='/philippines/hotlines'
              className='text-xs leading-12 text-gray-800 hover:text-primary-600 transition-colors'
            >
              Hotlines
            </Link>
            <div className='hidden md:block'>
              <select
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value as LanguageType)}
                className='text-xs border border-gray-300 rounded-sm px-2 py-1 bg-white text-gray-700 hover:border-primary-600 focus:outline-hidden focus:ring-1 focus:ring-primary-600 focus:border-primary-600'
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className='container mx-auto px-4'>
        <div className='flex justify-between items-center py-4'>
          <div className='flex items-center'>
            <Link to='/' className='flex items-center'>
              <img
                src='/logos/svg/BetterGov_Icon-Primary.svg'
                alt='BetterGov Logo'
                className='h-12 w-12 mr-3'
              />
              <div>
                <div className='text-black font-bold'>BetterGov.ph</div>
                <div className='text-xs text-gray-800'>
                  A community-run portal for the Philippines
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className='hidden lg:flex items-center lg:space-x-4 xl:space-x-8 lg:pr-6 xl:pr-24 lg:leading-10'>
            {mainNavigation.map(item => {
              const isActive = isActiveRoute(item.href);
              return (
                <div
                  key={item.label}
                  className='relative group'
                  onMouseEnter={() => handleDropdownMouseEnter(item.label)}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center font-medium transition-colors pb-1 border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'text-primary-600 border-primary-600'
                        : 'text-gray-700 hover:text-primary-600 border-transparent'
                    }`}
                  >
                    {t(`navbar.${item.label.toLowerCase()}`)}
                    {item.children && (
                      <ChevronDownIcon
                        className={`ml-1 h-4 w-4 transition-colors ${
                          isActive
                            ? 'text-primary-600'
                            : 'text-gray-800 group-hover:text-primary-600'
                        }`}
                      />
                    )}
                  </Link>
                  {item.children && (
                    <div
                      className={`absolute left-0 mt-2 lg:mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black/5 transition-all duration-200 z-50 ${
                        hoveredDropdown === item.label
                          ? 'opacity-100 visible'
                          : 'opacity-0 invisible'
                      }`}
                    >
                      <div
                        className='py-1'
                        role='menu'
                        aria-orientation='vertical'
                      >
                        {item.children.map(child => (
                          <Link
                            key={child.label}
                            to={child.href}
                            className='text-left block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                            role='menuitem'
                            target={child.target}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className='hidden lg:flex items-center space-x-6'>
            <Link
              to='/search'
              className='flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors'
            >
              <SearchIcon className='h-4 w-4 mr-1' />
              Search
            </Link>
            {/* <Link
              to="/sitemap"
              className="flex items-center text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              Sitemap
            </Link> */}
          </div>

          {/* Mobile menu button */}
          <div className='lg:hidden flex items-center'>
            <button
              onClick={toggleMenu}
              className='inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-500 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-primary-500'
            >
              <span className='sr-only'>Open main menu</span>
              {isOpen ? (
                <XIcon className='block h-6 w-6' aria-hidden='true' />
              ) : (
                <MenuIcon className='block h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className='container mx-auto px-2 pt-2 pb-4 space-y-1 border-t border-gray-200 bg-white'>
          {mainNavigation.map(item => {
            const isActive = isActiveRoute(item.href);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`w-full flex justify-between items-center px-4 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-500'
                  }`}
                >
                  {t(`navbar.${item.label.toLowerCase()}`)}
                  {item.children && (
                    <ChevronDownIcon
                      className={`h-5 w-5 transition-transform ${
                        activeMenu === item.label ? 'transform rotate-180' : ''
                      } ${isActive ? 'text-primary-600' : ''}`}
                    />
                  )}
                </button>
                {item.children && activeMenu === item.label && (
                  <div className='pl-6 py-2 space-y-1 bg-gray-50'>
                    {item.children.map(child => (
                      <Link
                        key={child.label}
                        to={child.href}
                        onClick={closeMenu}
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary-500'
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link
            to='/join-us'
            onClick={closeMenu}
            className='block px-4 py-2 text-base font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-700'
          >
            🚀 Join Us
          </Link>
          <Link
            to='/about'
            onClick={closeMenu}
            className='block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          >
            About
          </Link>
          <Link
            to='/search'
            onClick={closeMenu}
            className='block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          >
            Search
          </Link>
          <Link
            to='/sitemap'
            onClick={closeMenu}
            className='block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          >
            Sitemap
          </Link>
          <div className='px-4 py-3 border-t border-gray-200'>
            <div className='flex items-center'>
              <GlobeIcon className='h-5 w-5 text-gray-800 mr-2' />
              <select
                value={i18n.language}
                onChange={e => changeLanguage(e.target.value as LanguageType)}
                className='text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white text-gray-700 hover:border-primary-600 focus:outline-hidden focus:ring-1 focus:ring-primary-600 focus:border-primary-600'
              >
                {Object.entries(LANGUAGES).map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
