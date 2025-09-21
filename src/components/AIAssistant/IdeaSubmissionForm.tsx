import React, { useState } from 'react';
import { Bot, Send, AlertCircle } from 'lucide-react';
import {
  findSimilarIdeas,
  SimilarityResult,
} from '../../services/aiAssistant/duplicateDetection';
import DuplicateDetectionModal from './DuplicateDetectionModal';

interface IdeaSubmissionFormProps {
  existingIdeas: Array<{
    id: string;
    title: string;
    description: string;
    category?: string;
  }>;
  onSubmit: (title: string, description: string, category: string) => void;
  onClose: () => void;
}

export const IdeaSubmissionForm: React.FC<IdeaSubmissionFormProps> = ({
  existingIdeas,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarIdeas, setSimilarIdeas] = useState<SimilarityResult[]>([]);
  const [aiChecking, setAiChecking] = useState(false);

  const categories = [
    'Transparency & Accountability',
    'Public Feedback',
    'Platform Development',
    'Political Accountability',
    'Government Services',
    'Emergency Response',
    'Data & Analytics',
    'Citizen Engagement',
  ];

  const handleCheckDuplicates = async () => {
    if (!title || !description) {
      alert('Please provide both title and description');
      return;
    }

    setAiChecking(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    const similar = findSimilarIdeas(title, description, existingIdeas, 0.3);

    setAiChecking(false);

    if (similar.length > 0) {
      setSimilarIdeas(similar);
      setShowDuplicateModal(true);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = () => {
    onSubmit(title, description, category);
    setTitle('');
    setDescription('');
    setCategory('');
    setShowDuplicateModal(false);
  };

  return (
    <>
      <div className='fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4'>
        <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='p-2 bg-primary-100 rounded-lg mr-3'>
                  <Bot className='h-6 w-6 text-primary-600' />
                </div>
                <div>
                  <h3 className='text-xl font-semibold text-gray-900'>
                    Submit New Idea with AI Assistant
                  </h3>
                  <p className='text-sm text-gray-600'>
                    AI will check for duplicates before submission
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600'
              >
                ×
              </button>
            </div>
          </div>

          <div className='p-6 overflow-y-auto'>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Title *
                </label>
                <input
                  type='text'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder='Enter your idea title'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Describe your idea in detail'
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500'
                >
                  <option value=''>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <div className='flex items-start'>
                  <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5 mr-2' />
                  <div className='text-sm text-blue-800'>
                    <p className='font-medium mb-1'>AI Assistant Features:</p>
                    <ul className='list-disc list-inside space-y-1'>
                      <li>Automatic duplicate detection</li>
                      <li>Similar idea suggestions</li>
                      <li>Helps reduce redundancy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='p-6 border-t border-gray-200 bg-gray-50'>
            <div className='flex justify-end gap-3'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleCheckDuplicates}
                disabled={!title || !description || aiChecking}
                className={`px-4 py-2 text-white rounded-md flex items-center gap-2 ${
                  aiChecking
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {aiChecking ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent' />
                    AI Checking...
                  </>
                ) : (
                  <>
                    <Send className='h-4 w-4' />
                    Submit Idea
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DuplicateDetectionModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        similarIdeas={similarIdeas}
        onProceed={handleFinalSubmit}
        newIdeaTitle={title}
      />
    </>
  );
};

export default IdeaSubmissionForm;
