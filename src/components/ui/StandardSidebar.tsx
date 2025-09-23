import { ReactNode } from 'react';

interface StandardSidebarProps {
  children: ReactNode;
}

export default function StandardSidebar({ children }: StandardSidebarProps) {
  return (
    <div className='w-full md:w-64 shrink-0'>
      <div className='md:sticky md:top-6 space-y-4'>
        <div className='border rounded-lg overflow-hidden bg-white shadow-xs'>
          <div className='max-h-[60vh] md:max-h-[calc(100vh-200px)] overflow-y-auto py-4 px-2'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
