import { ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/utils';

interface SelectPickerOption {
  label: string;
  value: string;
}

interface SelectPickerProps {
  options: SelectPickerOption[];
  onSelect: (option: SelectPickerOption | null) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  selectedValue?: string;
}

const SelectPicker = ({
  options,
  onSelect,
  placeholder = 'Select an option...',
  className,
  size = 'md',
  disabled = false,
  searchable = true,
  clearable = true,
  selectedValue,
  ...props
}: SelectPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] =
    useState<SelectPickerOption | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>(
    'bottom'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Find selected option based on selectedValue prop
  useEffect(() => {
    if (selectedValue) {
      const option = options.find(opt => opt.value === selectedValue);
      setSelectedOption(option || null);
    }
  }, [selectedValue, options]);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle option selection
  const handleSelect = (option: SelectPickerOption) => {
    setSelectedOption(option);
    setIsOpen(false);
    setSearchTerm('');
    onSelect(option);
  };

  // Handle clear selection
  const handleClear = (e: ReactMouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onSelect(null);
  };

  // Check available space and determine dropdown position
  const checkDropdownPosition = () => {
    if (!triggerRef.current) return 'bottom';

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const dropdownHeight = 240; // max-h-60 = 240px

    // If there's not enough space below but enough space above, position on top
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return 'top';
    }

    return 'bottom';
  };

  // Handle toggle dropdown
  const handleToggle = () => {
    if (disabled) return;

    if (!isOpen) {
      // Check position before opening
      const position = checkDropdownPosition();
      setDropdownPosition(position);
    }

    setIsOpen(!isOpen);
    if (!isOpen && searchable) {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search input key down
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside and handle position updates
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleResize = () => {
      if (isOpen) {
        const position = checkDropdownPosition();
        setDropdownPosition(position);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        const position = checkDropdownPosition();
        setDropdownPosition(position);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const sizes = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };

  return (
    <div
      className={cn('relative w-full', className)}
      ref={dropdownRef}
      {...props}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type='button'
        className={cn(
          'w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white text-left',
          'focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'transition-all duration-200 ease-in-out',
          sizes[size],
          'px-3',
          disabled
            ? 'opacity-60 cursor-not-allowed bg-gray-50'
            : 'hover:border-gray-400',
          isOpen && 'border-primary-500 ring-2 ring-primary-500/20'
        )}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'truncate',
            selectedOption ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className='flex items-center space-x-1'>
          {clearable && selectedOption && !disabled && (
            <button
              type='button'
              className='p-1 hover:bg-gray-100 rounded-full transition-colors'
              onClick={handleClear}
              aria-label='Clear selection'
            >
              <XIcon className='h-4 w-4 text-gray-500' />
            </button>
          )}
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 text-gray-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden',
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
        >
          {/* Search Input */}
          {searchable && (
            <div className='p-2 border-b border-gray-200'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500' />
                <input
                  ref={searchInputRef}
                  type='text'
                  className='w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                  placeholder='Search options...'
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className='max-h-48 overflow-y-auto'>
            {filteredOptions.length > 0 ? (
              <ul role='listbox' className='py-1'>
                {filteredOptions.map(option => (
                  <li
                    key={option.value}
                    className={cn(
                      'px-3 py-2 cursor-pointer text-sm transition-colors',
                      'hover:bg-primary-50 hover:text-primary-700',
                      selectedOption?.value === option.value &&
                        'bg-primary-100 text-primary-700'
                    )}
                    onClick={() => handleSelect(option)}
                    role='option'
                    aria-selected={selectedOption?.value === option.value}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            ) : (
              <div className='px-3 py-2 text-sm text-gray-500 text-center'>
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPicker;
