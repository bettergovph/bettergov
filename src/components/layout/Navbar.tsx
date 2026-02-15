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

  /**
   * Removes a single trailing slash from a path string.
   *
   * This function returns a new string with one trailing '/' removed if present.
   * It does not alter other slashes inside the path. For the root path "/" the
   * returned value will be an empty string.
   *
   * @param path - The path to normalize.
   * @returns The normalized path without a trailing slash.
   *
   * @example
   * normalizePath("/about/"); // "/about"
   *
   * @example
   * normalizePath("/about"); // "/about"
   *
   * @example
   * normalizePath("/"); // ""
   */
  const normalizePath = (path: string): string => path.replace(/\/$/, '');

  // This function builds the full path
  // Edge cases for certain links are handled here
  const buildFullPath = (href: string): string => {
    let fullPath = location.pathname;

    // Edge case: for /government/*
    // Example:
    //    nav href: /government/legislative
    //    actual address: /government/legislative/senate-of-the-philippines-20th-congress
    if (href.startsWith('/government')) {
      const parts = fullPath.split('/');
      // ["", "government", "legislative", "senate-of-the-philippines-20th-congress"]
      if (parts.length > 3) {
        // Remove the last segment
        parts.pop();
        fullPath = parts.join('/');
      }
    }

    // We include the search queries because of /services
    return fullPath + location.search;
  };

  const isActiveRoute = (href: string) => {
    // Handle edge cases: null, undefined, or empty href
    if (!href) return false;

    // Normalize paths by removing trailing slashes
    const normalizedPath = normalizePath(location.pathname);
    const normalizedHref = normalizePath(href);

    // Check exact match or if current path starts with href
    return (
      normalizedPath === normalizedHref ||
      (normalizedHref !== '/' &&
        normalizedPath.startsWith(normalizedHref + '/'))
    );
  };

  const isActiveChildRoute = (href: string): boolean => {
    // Handle edge cases: null, undefined, or empty href
    if (!href) return false;

    const fullPath = buildFullPath(href);

    // Normalize paths by removing trailing slashes
    const normalizedPath = normalizePath(fullPath);
    const normalizedHref = normalizePath(href);

    // Check exact match or if current path equals href
    return normalizedHref !== '/' && normalizedPath === normalizedHref;
  };

  const handleDropdownMouseEnter = (label: string) => {
    setHoveredDropdown(label);
  };

  const handleDropdownMouseLeave = () => {
    setHoveredDropdown(null);
  };

  if (location.pathname === '/philippines/map') return null;

  return (
    <nav className='bg-white shadow-xs sticky top-0 z-50 overflow-x-clip'>
      {/* Top bar with language switcher and additional links */}
      <div className='border-b border-gray-200'>
        <div className='container mx-auto px-4 flex justify-center md:justify-end'>
          <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-xs md:justify-end'>
            <Link
              to='/join-us'
              className='inline-flex items-center font-semibold text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap min-[340px]:max-[374px]:order-1'
            >
              🚀 Join Us
            </Link>
            <Link
              to='/about'
              className='inline-flex items-center text-gray-800 hover:text-primary-600 transition-colors whitespace-nowrap min-[340px]:max-[374px]:order-2'
            >
              About <span className='hidden md:inline'>BetterGov.ph</span>
            </Link>
            <a
              href='https://www.gov.ph'
              className='inline-flex items-center text-gray-800 hover:text-primary-600 transition-colors whitespace-nowrap min-[340px]:max-[374px]:order-3'
              target='_blank'
              rel='noreferrer'
            >
              Official Gov.ph
            </a>
            <span className='hidden min-[340px]:max-[374px]:block min-[340px]:max-[374px]:basis-full min-[340px]:max-[374px]:order-4' />
            <Link
              to='/contact'
              className='inline-flex items-center text-gray-800 hover:text-primary-600 transition-colors whitespace-nowrap min-[340px]:max-[374px]:order-5'
            >
              Contact Us
            </Link>
            <Link
              to='/philippines/hotlines'
              className='inline-flex items-center text-gray-800 hover:text-primary-600 transition-colors whitespace-nowrap min-[340px]:max-[374px]:order-6'
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
          <div className='flex items-center shrink-0'>
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
          <div className='hidden lg:flex items-center min-w-0 lg:space-x-1 xl:space-x-3 2xl:space-x-6 lg:leading-10'>
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
                    <span className='lg:text-sm xl:text-base'>
                      {t(`navbar.${item.label.toLowerCase()}`)}
                    </span>
                    {item.children && (
                      <ChevronDownIcon
                        className={`ml-1 h-4 w-4 shrink-0 transition-colors ${
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
                            className={`text-left block px-4 py-2 text-sm ${
                              isActiveChildRoute(child.href)
                                ? 'bg-primary-500 text-primary-50 hover:bg-primary-500 hover:text-primary-50'
                                : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                            }`}
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
          <div className='hidden lg:flex items-center shrink-0 lg:leading-10'>
            <Link
              to='/search'
              className='flex items-center text-gray-700 hover:text-primary-600 font-semibold lg:text-base xl:text-lg transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap'
            >
              <SearchIcon className='h-5 w-5 mr-2 shrink-0' />
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
            className='flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          >
            About
          </Link>
          <Link
            to='/contact'
            onClick={closeMenu}
            className='flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500'
          >
            Contact Us
          </Link>
          <Link
            to='/search'
            onClick={closeMenu}
            className='flex items-center px-4 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-600'
          >
            <SearchIcon className='h-5 w-5 mr-2' />
            Search
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
