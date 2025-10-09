import { ReactNode, useState, useEffect } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface GovernmentPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function GovernmentPageHeader({
  title,
  subtitle,
  actions,
  className = '',
}: GovernmentPageHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8 ${className}`}
    >
      <div>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900 mb-2'>
          {title}
        </h1>
        {subtitle && (
          <p className='text-sm md:text-base text-gray-800'>{subtitle}</p>
        )}
      </div>
      {actions && <div className='shrink-0'>{actions}</div>}
    </div>
  );
}

interface GovernmentIndexPageContainerProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export default function GovernmentIndexPageContainer({
  children,
  sidebar,
  className = '',
}: GovernmentIndexPageContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToContent) {
      //contents different loading times
      const getTimeoutByRoute = (pathname: string) => {
        if (pathname.includes('/legislative')) return 190;
        if (pathname.includes('/executive')) return 150;
        if (pathname.includes('/constitutional')) return 120;
        if (pathname.includes('/diplomatic')) return 190;
        return 100;
      };

      const timeout = getTimeoutByRoute(location.pathname);

      setTimeout(() => {
        const contentElement = document.getElementById('government-content');
        if (contentElement) {
          const yScrollOffset = -140;
          const y = contentElement.offsetTop + yScrollOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, timeout);
    }
  }, [location]);

  return (
    <div className={`min-h-screen md:bg-gray-50 ${className}`}>
      <div className='container mx-auto sm:px-4 py-6 md:py-8'>
        {/* Mobile Sidebar Toggle */}
        {sidebar && (
          <div className='md:hidden mb-4'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='flex items-center justify-between w-full px-4 py-3 bg-white rounded-lg shadow-xs text-gray-900 font-medium border'
            >
              <span>Menu</span>
              {sidebarOpen ? (
                <XIcon className='h-5 w-5 text-gray-800' />
              ) : (
                <MenuIcon className='h-5 w-5 text-gray-800' />
              )}
            </button>
          </div>
        )}
        <div className='flex flex-col md:flex-row md:gap-8'>
          {sidebar && (
            <aside
              className={`${
                sidebarOpen ? 'block' : 'hidden'
              } md:block mb-6 md:mb-0 shrink-0 md:sticky md:top-[8.25rem] md:self-start`}
            >
              {sidebar}
            </aside>
          )}
          <main className='flex-1 min-w-0'>
            <div
              id='government-content'
              className='bg-white rounded-lg border shadow-xs p-4 md:p-8'
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
