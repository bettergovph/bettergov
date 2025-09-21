import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  SimilarityResult,
  getSimilarityLevel,
  formatSimilarityPercentage,
} from '../../services/aiAssistant/duplicateDetection';

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  similarIdeas: SimilarityResult[];
  onProceed: () => void;
  newIdeaTitle: string;
}

export const DuplicateDetectionModal: React.FC<
  DuplicateDetectionModalProps
> = ({ isOpen, onClose, similarIdeas, onProceed, newIdeaTitle }) => {
  if (!isOpen) return null;

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.8) return 'text-red-600 bg-red-50';
    if (score >= 0.6) return 'text-orange-600 bg-orange-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden'>
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-lg mr-3'>
                <AlertTriangle className='h-6 w-6 text-yellow-600' />
              </div>
              <div>
                <h3 className='text-xl font-semibold text-gray-900'>
                  Similar Ideas Detected
                </h3>
                <p className='text-sm text-gray-600 mt-1'>
                  AI Assistant found existing ideas similar to yours
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='h-6 w-6' />
            </button>
          </div>
        </div>

        <div className='p-6 overflow-y-auto max-h-[50vh]'>
          <div className='mb-4'>
            <p className='text-gray-700'>
              Your idea:{' '}
              <span className='font-medium'>&ldquo;{newIdeaTitle}&rdquo;</span>
            </p>
            <p className='text-sm text-gray-600 mt-2'>
              We found {similarIdeas.length} similar{' '}
              {similarIdeas.length === 1 ? 'idea' : 'ideas'}. Consider reviewing
              or contributing to existing ideas before creating a new one.
            </p>
          </div>

          <div className='space-y-3'>
            {similarIdeas.map(idea => (
              <div
                key={idea.id}
                className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900 mb-1'>
                      {idea.title}
                    </h4>
                    {idea.category && (
                      <span className='inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700'>
                        {idea.category}
                      </span>
                    )}
                  </div>
                  <div className='ml-4 text-right'>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSimilarityColor(idea.similarity)}`}
                    >
                      {formatSimilarityPercentage(idea.similarity)}
                    </div>
                    <div className='text-xs text-gray-500 mt-1'>
                      {getSimilarityLevel(idea.similarity)} Match
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='p-6 border-t border-gray-200 bg-gray-50'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-gray-600'>
              Help reduce duplicates and strengthen existing ideas
            </p>
            <div className='flex gap-3'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
              >
                Review Existing
              </button>
              <button
                onClick={onProceed}
                className='px-4 py-2 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors'
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateDetectionModal;
