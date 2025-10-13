import { ReactNode, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  size?: ModalSize;
  hideCloseButton?: boolean;
  className?: string;
  footer?: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({
  open,
  onClose,
  children,
  title,
  description,
  size = 'md',
  hideCloseButton = false,
  className,
  footer,
}: ModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6'>
      <div
        className='absolute inset-0 bg-gray-900/60 backdrop-blur-[1px]'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-2xl transition duration-200 ease-out',
          sizeClasses[size],
          className
        )}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className='flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5'>
          <div className='space-y-1.5'>
            {title && (
              <h2
                id='modal-title'
                className='text-lg font-semibold text-gray-900'
              >
                {title}
              </h2>
            )}
            {description && (
              <div className='text-sm text-gray-500'>{description}</div>
            )}
          </div>
          {!hideCloseButton && (
            <button
              type='button'
              onClick={onClose}
              className='rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20'
              aria-label='Close modal'
            >
              <XIcon className='h-5 w-5' />
            </button>
          )}
        </div>
        <div className='max-h-[65vh] overflow-y-auto px-6 py-5'>{children}</div>
        {footer && (
          <div className='border-t border-gray-100 px-6 py-4'>{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
