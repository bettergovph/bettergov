import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface StandardSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  children: ReactNode;
}

export default function StandardSidebar({
  children,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
}: StandardSidebarProps) {
  return (
    <div className='w-full md:w-64 flex-shrink-0'>
      <div className='md:sticky md:top-6 space-y-4'>
        {/* Search input - uncomment if needed */}
        {/* <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div> */}

        <div className='border rounded-lg overflow-hidden bg-white shadow-sm'>
          <div className='max-h-[60vh] md:max-h-[calc(100vh-200px)] overflow-y-auto py-4 px-2'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
