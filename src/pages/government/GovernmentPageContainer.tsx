import { ReactNode, useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface GovernmentPageContainerProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export default function GovernmentPageContainer({
  children,
  sidebar,
  className = '',
}: GovernmentPageContainerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('/government/')) {
      window.history.scrollRestoration = 'manual';

      const timer = setTimeout(() => {
        const currentScroll = window.pageYOffset;
        const isMobile = window.innerWidth < 768;

        if (currentScroll < 50) {
          const targetScroll = isMobile ? 1000 : 500;

          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      }, 70);

      return () => {
        clearTimeout(timer);
        window.history.scrollRestoration = 'auto';
      };
    }
  }, [location.pathname]);

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
                <X className='h-5 w-5 text-gray-800' />
              ) : (
                <Menu className='h-5 w-5 text-gray-800' />
              )}
            </button>
          </div>
        )}

        <div className='flex flex-col md:flex-row md:gap-8'>
          {sidebar && (
            <aside
              className={`${
                sidebarOpen ? 'block' : 'hidden'
              } md:block mb-6 md:mb-0 shrink-0`}
            >
              {sidebar}
            </aside>
          )}
          <main className='flex-1 min-w-0'>
            <div className='bg-white rounded-lg border shadow-xs p-4 md:p-8'>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
