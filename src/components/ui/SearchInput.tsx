import { SearchIcon, XIcon } from 'lucide-react';
import { ChangeEvent, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (value: string) => void;
  className?: string;
  placeholder?: string;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
}

const SearchInput = ({
  onSearch,
  className,
  placeholder = 'Search...',
  icon = <SearchIcon className='h-5 w-5 text-gray-800' />,
  size = 'md',
  clearable = true,
  value,
  onChange,
  ...props
}: SearchInputProps) => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(String(value || ''));
    }
  };

  const handleClear = () => {
    if (onSearch) {
      onSearch('');
    }

    if (onChange) {
      const event = { target: { value: '' } } as ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const sizes = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
          {icon}
        </div>
        <input
          type='text'
          className={cn(
            'w-full rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
            'bg-white text-gray-900 placeholder-gray-500',
            'transition-all duration-200 ease-in-out',
            sizes[size],
            'pl-10',
            clearable && value ? 'pr-10' : 'pr-4'
          )}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
        {clearable && value && (
          <button
            type='button'
            className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-800 hover:text-gray-700'
            onClick={handleClear}
          >
            <XIcon className='h-5 w-5' />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchInput;
