import { ReactNode } from 'react';

interface StandardSidebarProps {
  children: ReactNode;
}

export default function StandardSidebar({ children }: StandardSidebarProps) {
  return (
    <div className='w-full md:w-64 shrink-0 md:sticky top-32'>
      <div className='md:sticky md:top-6 space-y-4'>
        <div className='border border-r-2 border-r-gray-300 rounded-lg overflow-hidden bg-white shadow-xs'>
          <div className='max-h-[60vh] md:max-h-[calc(100vh-200px)] overflow-y-auto py-4 px-2 scrollbar-thin'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
