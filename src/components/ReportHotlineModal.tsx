import { FC, useState, useEffect, useRef } from 'react';
import { AlertCircleIcon, XIcon, ExternalLinkIcon } from 'lucide-react';

interface ReportHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
}

const ReportHotlineModal: FC<ReportHotlineModalProps> = ({
  isOpen,
  onClose,
  closeOnBackdropClick = true,
}) => {
  const [formData, setFormData] = useState({
    hotlineName: '',
    issue: '',
    correctInfo: '',
    source: '',
    reporterEmail: '',
  });
  const [emailConsent, setEmailConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    issueUrl?: string;
  }>({ type: null, message: '' });

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus management: capture previous focus and set initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Capture the currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Set focus to the first focusable element in the modal
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Restore focus when modal closes
    return () => {
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen]);

  // Focus trap: keep focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000); // 10 second timeout

    try {
      const response = await fetch('/api/report-hotline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Only include email if consent is given
          reporterEmail: emailConsent ? formData.reporterEmail : '',
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      // Clear timeout after both fetch and JSON parse complete
      clearTimeout(timeoutId);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Report submitted successfully!',
          issueUrl: data.issueUrl,
        });
        // Reset form
        setFormData({
          hotlineName: '',
          issue: '',
          correctInfo: '',
          source: '',
          reporterEmail: '',
        });
        setEmailConsent(false);
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to submit report',
        });
      }
    } catch (error) {
      // Clear timeout in case of error
      clearTimeout(timeoutId);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Check if the error was due to abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        setSubmitStatus({
          type: 'error',
          message:
            'Request timed out. Please check your connection and try again.',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message:
            'Network error. Please try again or contact us at bugs@bettergov.ph',
        });
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby='modal-title'
    >
      <div
        ref={modalRef}
        className='bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
        onClick={e => e.stopPropagation()}
      >
        <div className='sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center'>
          <h2 id='modal-title' className='text-2xl font-bold'>
            Report Outdated Hotline
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            aria-label='Close'
          >
            <XIcon className='h-6 w-6' />
          </button>
        </div>

        <div className='p-6'>
          {submitStatus.type === 'success' ? (
            <div className='text-center py-8'>
              <div className='mb-4 text-green-600'>
                <svg
                  className='w-16 h-16 mx-auto'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold mb-2'>Thank you!</h3>
              <p className='text-gray-600 mb-4'>{submitStatus.message}</p>
              {submitStatus.issueUrl && (
                <a
                  href={submitStatus.issueUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center text-blue-600 hover:underline mb-4'
                >
                  View your report on GitHub
                  <ExternalLinkIcon className='h-4 w-4 ml-1' />
                </a>
              )}
              <div className='mt-6'>
                <button
                  onClick={onClose}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className='text-gray-600 mb-6'>
                Help us keep hotline information accurate and up-to-date. Your
                report will be submitted as a public GitHub issue so volunteers
                can help fix it.
              </p>

              {submitStatus.type === 'error' && (
                <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700'>
                  <AlertCircleIcon className='h-5 w-5 inline mr-2' />
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Hotline Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    value={formData.hotlineName}
                    onChange={e =>
                      setFormData({ ...formData, hotlineName: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='e.g., National Emergency Hotline'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    What is incorrect? <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    required
                    value={formData.issue}
                    onChange={e =>
                      setFormData({ ...formData, issue: e.target.value })
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Describe what information is outdated or incorrect'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    What should it be? (optional)
                  </label>
                  <textarea
                    value={formData.correctInfo}
                    onChange={e =>
                      setFormData({ ...formData, correctInfo: e.target.value })
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Provide the correct information if you know it'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Source (optional)
                  </label>
                  <input
                    type='url'
                    value={formData.source}
                    onChange={e =>
                      setFormData({ ...formData, source: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='Link to official source confirming the correct information'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Your Email (optional)
                  </label>
                  <input
                    type='email'
                    value={formData.reporterEmail}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        reporterEmail: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='your.email@example.com'
                    disabled={!emailConsent}
                  />
                  <div className='mt-2'>
                    <label className='flex items-start'>
                      <input
                        type='checkbox'
                        checked={emailConsent}
                        onChange={e => {
                          setEmailConsent(e.target.checked);
                          if (!e.target.checked) {
                            setFormData({ ...formData, reporterEmail: '' });
                          }
                        }}
                        className='mt-1 mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      />
                      <span className='text-xs text-gray-600'>
                        I consent to sharing my email address. It will be
                        visible only to maintainers (not in the public GitHub
                        issue) so they can contact me for clarification if
                        needed.
                      </span>
                    </label>
                  </div>
                </div>

                <div className='flex gap-3 pt-4'>
                  <button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>

              <p className='text-xs text-gray-500 mt-4 text-center'>
                Your report will be publicly visible on GitHub. Your email (if
                provided) will only be visible to maintainers in a private
                comment.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportHotlineModal;
