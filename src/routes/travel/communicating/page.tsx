import { FC, ReactNode, useState } from 'react';
import {
  MessageCircle,
  BookOpen,
  Globe,
  Utensils,
  ShoppingBag,
  Bus,
  BedDouble,
  Navigation,
  AlertCircle,
  Hash,
  Printer,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { phrasesData } from './phrasesData';

const CommunicatingPage: FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<
    'english' | 'chinese' | 'korean' | 'japanese' | 'arabic'
  >('english');

  const categoryIcons: Record<string, ReactNode> = {
    Greetings: <MessageCircle className='h-5 w-5' />,
    'Basic Phrases': <BookOpen className='h-5 w-5' />,
    'At the Restaurant': <Utensils className='h-5 w-5' />,
    Shopping: <ShoppingBag className='h-5 w-5' />,
    Transportation: <Bus className='h-5 w-5' />,
    'Hotel/Accommodation': <BedDouble className='h-5 w-5' />,
    Directions: <Navigation className='h-5 w-5' />,
    Emergency: <AlertCircle className='h-5 w-5' />,
    'Numbers & Money': <Hash className='h-5 w-5' />,
  };

  // Filter by active category
  const filteredCategories = phrasesData.filter(
    (category: (typeof phrasesData)[0]) =>
      activeCategory === 'all' || category.category === activeCategory
  );

  // Create category tabs
  const categoryTabs = [
    { id: 'all', name: 'All Phrases', icon: <Globe className='h-5 w-5' /> },
    ...phrasesData.map((cat: (typeof phrasesData)[0]) => ({
      id: cat.category,
      name: cat.category,
      icon: categoryIcons[cat.category] || <Globe className='h-5 w-5' />,
    })),
  ];

  return (
    <div className='bg-gray-50 min-h-screen print:bg-white'>
      {/* Hero Section */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4 print:bg-white print:text-gray-900 print:py-4'>
        <div className='container mx-auto max-w-7xl'>
          {/* Print/Save Button - Top Right */}
          <div className='flex justify-end mb-4 print:hidden'>
            <button
              onClick={() =>
                navigate(`/travel/communicating/print?lang=${selectedLanguage}`)
              }
              className='flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md text-sm'
            >
              <Printer className='h-4 w-4' />
              Print Version
            </button>
          </div>

          <div className='text-center'>
            <div className='flex justify-center mb-4'>
              <div className='bg-white/20 backdrop-blur-sm p-4 rounded-full'>
                <MessageCircle className='h-12 w-12' />
              </div>
            </div>
            <h1 className='text-4xl md:text-6xl font-bold mb-4'>
              Travel Phrasebook
            </h1>
            <p className='text-xl md:text-2xl opacity-90 mb-6 max-w-3xl mx-auto'>
              Essential phrases for communicating with locals across Asia
            </p>

            {/* Language Selector in Hero */}
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto print:hidden'>
              <label
                htmlFor='language-select-hero'
                className='text-lg font-medium whitespace-nowrap'
              >
                Select Foreign Language:
              </label>
              <select
                id='language-select-hero'
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
                className='px-6 py-3 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-lg bg-blue-700 text-white cursor-pointer font-medium hover:bg-blue-800 transition-colors'
              >
                <option value='english'>English</option>
                <option value='chinese'>中文 Chinese</option>
                <option value='korean'>한국어 Korean</option>
                <option value='japanese'>日本語 Japanese</option>
                <option value='arabic'>العربية Arabic</option>
              </select>
            </div>

            {/* Print-only language indicator */}
            <div className='hidden print:block text-center mt-4'>
              <p className='text-lg font-semibold'>
                Language: {selectedLanguage === 'english' && 'English'}
                {selectedLanguage === 'chinese' && '中文 Chinese'}
                {selectedLanguage === 'korean' && '한국어 Korean'}
                {selectedLanguage === 'japanese' && '日本語 Japanese'}
                {selectedLanguage === 'arabic' && 'العربية Arabic'} • Tagalog •
                Visaya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className='container mx-auto max-w-7xl px-4 py-8 print:hidden'>
        <div className='flex flex-wrap justify-center gap-2'>
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center px-4 py-2 rounded-full cursor-pointer transition-colors ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-800 shadow-sm'
              }`}
            >
              <span className='mr-2'>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto max-w-7xl px-4 pb-8 print:pt-4'>
        {filteredCategories.length > 0 ? (
          <div className='space-y-8'>
            {filteredCategories.map(
              (category: (typeof filteredCategories)[0], idx: number) => (
                <div
                  key={idx}
                  className='bg-white rounded-lg shadow-md overflow-hidden print:shadow-none print:border print:border-gray-300 print:break-inside-avoid print:mb-8'
                >
                  {/* Category Header */}
                  <div className='bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 print:bg-gray-100 print:text-gray-900 print:border-b print:border-gray-300'>
                    <div className='flex items-center gap-3'>
                      {categoryIcons[category.category] || (
                        <Globe className='h-5 w-5' />
                      )}
                      <h2 className='text-2xl font-bold'>
                        {category.category}
                      </h2>
                    </div>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='bg-gray-100 border-b-2 border-gray-200'>
                          <th
                            className={`px-4 py-3 text-left font-semibold text-gray-700 text-sm md:text-base ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                          >
                            {selectedLanguage === 'english' && 'English'}
                            {selectedLanguage === 'chinese' && '中文 Chinese'}
                            {selectedLanguage === 'korean' && '한국어 Korean'}
                            {selectedLanguage === 'japanese' &&
                              '日本語 Japanese'}
                            {selectedLanguage === 'arabic' && 'العربية Arabic'}
                          </th>
                          {selectedLanguage !== 'english' && (
                            <th className='px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm md:text-base w-1/4'>
                              Ingles
                            </th>
                          )}
                          <th
                            className={`px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm md:text-base ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                          >
                            Tagalog
                          </th>
                          <th
                            className={`px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm md:text-base ${selectedLanguage === 'english' ? 'w-1/3' : 'w-1/4'}`}
                          >
                            Bisaya
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.phrases.map(
                          (
                            phrase: (typeof category.phrases)[0],
                            phraseIdx: number
                          ) => (
                            <tr
                              key={phraseIdx}
                              className='border-b border-gray-200 hover:bg-blue-50 transition-colors print:break-inside-avoid'
                            >
                              <td className='px-4 py-4 text-gray-800 text-sm md:text-base'>
                                {selectedLanguage === 'english' &&
                                  phrase.english}
                                {selectedLanguage === 'chinese' &&
                                  phrase.chinese}
                                {selectedLanguage === 'korean' && phrase.korean}
                                {selectedLanguage === 'japanese' &&
                                  phrase.japanese}
                                {selectedLanguage === 'arabic' && phrase.arabic}
                              </td>
                              {selectedLanguage !== 'english' && (
                                <td className='px-4 py-4 text-gray-900 font-medium text-sm md:text-base bg-blue-50/30'>
                                  {phrase.english}
                                </td>
                              )}
                              <td className='px-4 py-4 text-gray-800 text-sm md:text-base bg-blue-50/30'>
                                {phrase.tagalog}
                              </td>
                              <td className='px-4 py-4 text-gray-800 text-sm md:text-base bg-blue-50/30'>
                                {phrase.visaya}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-md p-12 text-center'>
            <Globe className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-2xl font-semibold text-gray-700 mb-2'>
              No phrases found
            </h3>
            <p className='text-gray-500'>
              Try adjusting your search terms or browse all categories above
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className='container mx-auto max-w-7xl px-4 pb-8 print:hidden'>
        <div className='bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg'>
          <div className='flex items-start'>
            <Globe className='h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0' />
            <div>
              <h3 className='font-semibold text-blue-900 text-lg mb-2'>
                Travel Tips
              </h3>
              <ul className='text-blue-800 space-y-1 text-sm md:text-base'>
                <li>
                  • Always learn basic greetings in the local language - it
                  shows respect and opens doors
                </li>
                <li>
                  • Keep a physical or digital copy of emergency phrases handy
                </li>
                <li>• Use hand gestures and be patient when communicating</li>
                <li>
                  • Download offline translation apps before traveling to areas
                  with limited internet
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicatingPage;
