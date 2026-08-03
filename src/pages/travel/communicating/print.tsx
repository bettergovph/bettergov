import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { phrasesData } from './phrasesData';

const CommunicatingPrintPage: FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedLanguage, setSelectedLanguage] = useState<
    'english' | 'chinese' | 'korean' | 'japanese' | 'arabic'
  >('english');

  useEffect(() => {
    const lang = searchParams.get('lang') as
      | 'chinese'
      | 'korean'
      | 'japanese'
      | 'arabic';
    if (lang && ['chinese', 'korean', 'japanese', 'arabic'].includes(lang)) {
      setSelectedLanguage(lang);
    }
  }, [searchParams]);

  const getLanguageLabel = () => {
    switch (selectedLanguage) {
      case 'english':
        return 'English';
      case 'chinese':
        return '中文 Chinese';
      case 'korean':
        return '한국어 Korean';
      case 'japanese':
        return '日本語 Japanese';
      case 'arabic':
        return 'العربية Arabic';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Hide navbar and footer when printing */}
      <style>{`
        @media print {
          nav, footer, header {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className='min-h-screen bg-white p-4 print:p-2'>
        {/* Simple Logo Header - Print Only */}
        <div className='hidden print:block mb-3 pb-2 border-b border-gray-300'>
          <div className='flex items-center gap-2'>
            <svg
              className='h-5 w-5 text-blue-600'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z' />
            </svg>
            <div>
              <h1 className='text-base font-bold text-gray-900'>
                Travel Phrasebook
              </h1>
              <p className='text-xs text-gray-600'>BetterGov.ph</p>
            </div>
          </div>
        </div>

        {/* Header with Logo and Language Selector - Screen Only */}
        <div className='max-w-7xl mx-auto mb-6 print:hidden'>
          <div className='flex items-center justify-between mb-4 border-b-2 border-blue-600 pb-4'>
            <div className='flex items-center gap-3'>
              <img
                src='/logo.svg'
                alt='BetterGov Logo'
                className='h-8 w-8'
                onError={e => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Travel Phrasebook
                </h1>
                <p className='text-sm text-gray-600'>BetterGov.ph</p>
              </div>
            </div>

            {/* Language Selector - Print Hidden */}
            <div className='flex items-center gap-3 print:hidden'>
              <label
                htmlFor='language-select'
                className='text-sm font-medium text-gray-700'
              >
                Language:
              </label>
              <select
                id='language-select'
                value={selectedLanguage}
                onChange={e =>
                  setSelectedLanguage(
                    e.target.value as
                      | 'english'
                      | 'chinese'
                      | 'korean'
                      | 'japanese'
                      | 'arabic'
                  )
                }
                className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer'
              >
                <option value='english'>English</option>
                <option value='chinese'>中文 Chinese</option>
                <option value='korean'>한국어 Korean</option>
                <option value='japanese'>日本語 Japanese</option>
                <option value='arabic'>العربية Arabic</option>
              </select>
              <button
                onClick={() => window.print()}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors'
              >
                Print / Save PDF
              </button>
            </div>

            {/* Print-only language display */}
            <div className='hidden print:block text-sm font-semibold text-gray-700'>
              {getLanguageLabel()} • English • Tagalog • Visaya
            </div>
          </div>
        </div>

        {/* Compact Phrases Grid */}
        <div className='max-w-7xl mx-auto space-y-6 print:space-y-3'>
          {phrasesData.map((category, idx) => (
            <div
              key={idx}
              className='break-inside-avoid border border-gray-300 rounded-lg overflow-hidden'
            >
              {/* Category Header - Compact */}
              <div className='bg-blue-600 text-white px-3 py-2 print:px-2 print:py-1'>
                <h2 className='text-lg print:text-base font-bold'>
                  {category.category}
                </h2>
              </div>

              {/* Compact Table */}
              <table className='w-full text-sm print:text-xs'>
                <thead>
                  <tr className='bg-gray-100 border-b border-gray-300'>
                    <th
                      className={`px-2 py-1.5 print:py-1 text-left font-semibold text-gray-700 ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                    >
                      {getLanguageLabel()}
                    </th>
                    {selectedLanguage !== 'english' && (
                      <th className='px-2 py-1.5 print:py-1 text-left font-semibold text-gray-700 w-1/4'>
                        Ingles
                      </th>
                    )}
                    <th
                      className={`px-2 py-1.5 print:py-1 text-left font-semibold text-gray-700 ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                    >
                      Tagalog
                    </th>
                    <th
                      className={`px-2 py-1.5 print:py-1 text-left font-semibold text-gray-700 ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                    >
                      Bisaya
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {category.phrases.map((phrase, phraseIdx) => (
                    <tr
                      key={phraseIdx}
                      className='border-b border-gray-200 last:border-b-0'
                    >
                      <td className='px-2 py-1.5 print:py-1 text-gray-800'>
                        {selectedLanguage === 'english' && phrase.english}
                        {selectedLanguage === 'chinese' && phrase.chinese}
                        {selectedLanguage === 'korean' && phrase.korean}
                        {selectedLanguage === 'japanese' && phrase.japanese}
                        {selectedLanguage === 'arabic' && phrase.arabic}
                      </td>
                      {selectedLanguage !== 'english' && (
                        <td className='px-2 py-1.5 print:py-1 text-gray-900 font-medium'>
                          {phrase.english}
                        </td>
                      )}
                      <td className='px-2 py-1.5 print:py-1 text-gray-800'>
                        {phrase.tagalog}
                      </td>
                      <td className='px-2 py-1.5 print:py-1 text-gray-800'>
                        {phrase.visaya}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer - Print Hidden */}
        <div className='max-w-7xl mx-auto mt-8 print:hidden'>
          <div className='bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg'>
            <p className='text-sm text-blue-900'>
              <strong>Tip:</strong> Use your browser&apos;s print function
              (Ctrl/Cmd + P) to save this as a PDF to your phone or print it out
              for offline use while traveling.
            </p>
          </div>
        </div>

        {/* Print-only footer */}
        <div className='hidden print:block max-w-7xl mx-auto mt-4 pt-2 border-t border-gray-300'>
          <p className='text-xs text-gray-600 text-center'>
            Generated from BetterGov.ph • Travel Phrasebook • For personal use
            only
          </p>
        </div>
      </div>
    </>
  );
};

export default CommunicatingPrintPage;
