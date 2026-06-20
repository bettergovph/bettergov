import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  ExternalLink,
  Bot,
  User,
  MessageCircle,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { civicEngine, ServiceItem, askAI } from '../../lib/assistant';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const CivicAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'ai'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ServiceItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await civicEngine.initialize();
      setIsInitializing(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, results, isTyping, isAiLoading]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length > 1) {
      setIsTyping(true);
      const matches = civicEngine.query(val);
      setResults(matches);
      setTimeout(() => setIsTyping(false), 300);
    } else {
      setResults([]);
    }
  };

  const handleAiSubmit = async () => {
    const question = aiInput.trim();
    if (!question || isAiLoading) return;

    setAiInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsAiLoading(true);

    const responseDetail = await fetch(
      'https://jsonplaceholder.typicode.com/users'
    );
    const data = await responseDetail.json();
    const context = JSON.stringify(data);

    const response = await askAI(question, context);

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsAiLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAiSubmit();
  };

  const switchMode = (newMode: 'search' | 'ai') => {
    setMode(newMode);
    setTimeout(() => {
      if (newMode === 'search') {
        inputRef.current?.focus();
      } else {
        aiInputRef.current?.focus();
      }
    }, 100);
  };

  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>
      {isOpen && (
        <div
          className={cn(
            'mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transition-all duration-300 transform scale-100 origin-bottom-right',
            'dark:bg-gray-900 dark:border-gray-800'
          )}
        >
          {/* Header */}
          <div className='bg-primary-600 p-4 flex flex-col gap-3 text-white'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='p-1.5 bg-white/20 rounded-lg'>
                  <Bot size={20} className='text-white' />
                </div>
                <span className='font-semibold text-sm tracking-tight'>
                  Civic Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className='p-1 hover:bg-white/10 rounded-full transition-colors'
              >
                <X size={18} />
              </button>
            </div>
            <div className='flex bg-white/10 rounded-lg p-0.5'>
              <button
                onClick={() => switchMode('search')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  mode === 'search'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-white/80 hover:text-white'
                )}
              >
                <Search size={14} />
                Search
              </button>
              <button
                onClick={() => switchMode('ai')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  mode === 'ai'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-white/80 hover:text-white'
                )}
              >
                <MessageCircle size={14} />
                Talk to AI
              </button>
            </div>
          </div>

          {/* Body */}
          <div className='h-96 flex flex-col'>
            <div ref={chatRef} className='flex-1 p-5 overflow-y-auto space-y-4'>
              {mode === 'search' ? (
                <>
                  <div className='flex gap-2'>
                    <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0'>
                      <Bot size={14} className='text-primary-600' />
                    </div>
                    <div className='bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] text-gray-700 dark:text-gray-300'>
                      {isInitializing
                        ? 'Initialzing knowledge base...'
                        : 'Hello! I can help you find government services. What are you looking for?'}
                    </div>
                  </div>

                  {results.length > 0 && (
                    <div className='space-y-2'>
                      <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1'>
                        Found Services
                      </span>
                      {results.map(item => (
                        <a
                          key={item.id}
                          href={item.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='block group p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-md transition-all dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-900'
                        >
                          <div className='flex items-start justify-between'>
                            <span className='text-xs font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors'>
                              {item.service}
                            </span>
                            <ExternalLink
                              size={12}
                              className='text-gray-300 mt-0.5 group-hover:text-primary-400'
                            />
                          </div>
                          <div className='mt-1 flex gap-1.5 flex-wrap'>
                            <span className='text-[9px] px-1.5 bg-gray-50 text-gray-500 rounded border border-gray-100 dark:bg-gray-900 dark:border-gray-800'>
                              {item.category.name}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {isTyping && (
                    <div className='flex gap-1 pl-10'>
                      <div
                        className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className='flex gap-2'>
                      <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0'>
                        <Bot size={14} className='text-primary-600' />
                      </div>
                      <div className='bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] text-gray-700 dark:text-gray-300'>
                        {isInitializing
                          ? 'Initializing AI...'
                          : 'Hi! I can answer questions about government services. How can I help you today?'}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-2',
                        msg.role === 'user' && 'flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          msg.role === 'user'
                            ? 'bg-primary-100'
                            : 'bg-gray-100 dark:bg-gray-800'
                        )}
                      >
                        {msg.role === 'user' ? (
                          <User size={14} className='text-primary-600' />
                        ) : (
                          <Bot size={14} className='text-primary-600' />
                        )}
                      </div>
                      <div
                        className={cn(
                          'p-3 rounded-2xl text-sm max-w-[85%]',
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-tl-none'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className='flex gap-2'>
                      <div className='w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0'>
                        <Bot size={14} className='text-primary-600' />
                      </div>
                      <div className='bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%]'>
                        <div className='flex gap-1'>
                          <div
                            className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                            style={{ animationDelay: '0ms' }}
                          />
                          <div
                            className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                            style={{ animationDelay: '150ms' }}
                          />
                          <div
                            className='w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce'
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input */}
            <div className='p-4 border-t border-gray-100 dark:border-gray-800'>
              {mode === 'search' ? (
                <div className='relative flex items-center'>
                  <input
                    ref={inputRef}
                    type='text'
                    placeholder='e.g. Passport, SSS, Housing...'
                    className='w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none'
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    disabled={isInitializing}
                  />
                  <div className='absolute right-3 text-primary-500'>
                    <Send
                      size={16}
                      className={cn(
                        query.length > 0 ? 'opacity-100' : 'opacity-30'
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className='relative flex items-center'>
                  <input
                    ref={aiInputRef}
                    type='text'
                    placeholder='Ask about government services...'
                    className='w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none'
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isInitializing || isAiLoading}
                  />
                  <button
                    onClick={handleAiSubmit}
                    className='absolute right-2 p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-30'
                    disabled={!aiInput.trim() || isAiLoading}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen)
            setTimeout(
              () =>
                (mode === 'ai'
                  ? aiInputRef.current
                  : inputRef.current
                )?.focus(),
              100
            );
        }}
        className={cn(
          'p-4 bg-primary-600 rounded-full text-white shadow-xl hover:bg-primary-700 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group',
          isOpen ? 'rotate-90 bg-gray-800 hover:bg-black' : ''
        )}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className='relative'>
            <Sparkles size={24} className='group-hover:animate-pulse' />
            <div className='absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary-500 border-2 border-primary-600 rounded-full' />
          </div>
        )}
      </button>
    </div>
  );
};

export default CivicAssistant;
