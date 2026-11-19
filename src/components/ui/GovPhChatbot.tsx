import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Bot,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  askAssistant,
  AssistantError,
  clearConversation,
  loadConversation,
  sanitizeAssistantHtml,
  saveConversation,
  type AssistantConfirmation,
  type PendingConfirmation,
} from '../../lib/assistant';

/**
 * BetterGov Chatbot — a floating chat window backed by the eGovAI "govph"
 * engine through this site's own Worker (see src/lib/assistant.ts).
 */

const SUGGESTIONS = [
  'How do I renew my passport?',
  'What are the requirements for an NBI clearance?',
  'How do I get a PhilSys national ID?',
];

type MessageStatus = 'pending' | 'done' | 'error';
type ConfirmationState = 'open' | 'approved' | 'declined';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  status: MessageStatus;
  /** User: the question. Assistant: partial text while streaming. */
  text?: string;
  /** Assistant: sanitised final answer. */
  html?: string;
  /** Assistant: current progress label while pending. */
  progress?: string;
  error?: string;
  /** Assistant: the question that produced it (for retry / approval). */
  question?: string;
  pendingConfirmation?: PendingConfirmation | null;
  confirmationState?: ConfirmationState;
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Below Tailwind's `sm` breakpoint the panel takes over the whole viewport
 * instead of floating as a card, so the page underneath must stop scrolling
 * and the floating toggle gets out of the way.
 */
const COMPACT_QUERY = '(max-width: 639px)';

const GovPhChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [viewport, setViewport] = useState<{
    height: number;
    top: number;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const sessionRef = useRef<string | null>(null);

  // Restore the last conversation from this tab, if any.
  useEffect(() => {
    const stored = loadConversation();
    if (stored) {
      sessionRef.current = stored.sessionId;
      setSessionId(stored.sessionId);
      setMessages(
        stored.messages.map(message => ({
          id: message.id,
          role: message.role,
          status: 'done',
          text: message.role === 'user' ? message.text : undefined,
          html: message.role === 'assistant' ? message.html : undefined,
        }))
      );
    }
    setHydrated(true);
  }, []);

  // Persist only settled messages; a pending answer is never stored.
  useEffect(() => {
    if (!hydrated) return;
    saveConversation({
      sessionId,
      messages: messages
        .filter(message => message.status === 'done')
        .map(message => ({
          id: message.id,
          role: message.role,
          text: message.role === 'user' ? message.text : undefined,
          html: message.role === 'assistant' ? message.html : undefined,
        })),
    });
  }, [hydrated, messages, sessionId]);

  // Keep the newest message in view, also when the keyboard shrinks the log.
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, isOpen, viewport]);

  // Abort any in-flight request when the widget unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Follow the viewport so the full-screen phone layout and the floating
  // desktop card switch live when the window is resized or rotated.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(COMPACT_QUERY);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Full-screen on a phone means the page behind must not scroll.
  useEffect(() => {
    if (!isOpen || !isCompact) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen, isCompact]);

  // The on-screen keyboard shrinks the *visual* viewport but leaves 100dvh
  // and the layout viewport alone, so a fixed full-height panel keeps its
  // composer underneath the keyboard. While open on a phone, size the panel
  // from the visual viewport instead, and follow its offset so that iOS
  // panning the page to reveal the focused input keeps the panel in place.
  useEffect(() => {
    if (!isOpen || !isCompact) return;
    const visual = window.visualViewport;
    if (!visual) return;
    const update = () =>
      setViewport({
        height: Math.round(visual.height),
        top: Math.round(visual.offsetTop),
      });
    update();
    visual.addEventListener('resize', update);
    visual.addEventListener('scroll', update);
    return () => {
      visual.removeEventListener('resize', update);
      visual.removeEventListener('scroll', update);
      setViewport(null);
    };
  }, [isOpen, isCompact]);

  const patchMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages(prev =>
        prev.map(message =>
          message.id === id ? { ...message, ...patch } : message
        )
      );
    },
    []
  );

  const ask = useCallback(
    async (
      question: string,
      options: { confirmation?: AssistantConfirmation; echo?: boolean } = {}
    ) => {
      const trimmed = question.trim();
      if (!trimmed || busyRef.current) return;

      const { confirmation, echo = true } = options;
      const assistantId = newId();

      setMessages(prev => [
        ...prev,
        ...(echo
          ? [
              {
                id: newId(),
                role: 'user' as const,
                status: 'done' as const,
                text: confirmation ? 'Yes, go ahead.' : trimmed,
              },
            ]
          : []),
        {
          id: assistantId,
          role: 'assistant',
          status: 'pending',
          question: trimmed,
          progress: 'Connecting to the assistant',
        },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;
      busyRef.current = true;
      setIsBusy(true);

      try {
        const answer = await askAssistant({
          question: trimmed,
          sessionId: sessionRef.current,
          confirmation,
          signal: controller.signal,
          onProgress: label => patchMessage(assistantId, { progress: label }),
          onChunk: content =>
            setMessages(prev =>
              prev.map(message =>
                message.id === assistantId
                  ? {
                      ...message,
                      text: (message.text ?? '') + content,
                      progress: undefined,
                    }
                  : message
              )
            ),
        });

        if (answer.sessionId) {
          sessionRef.current = answer.sessionId;
          setSessionId(answer.sessionId);
        }

        patchMessage(assistantId, {
          status: 'done',
          html: sanitizeAssistantHtml(answer.answerHtml),
          text: undefined,
          progress: undefined,
          pendingConfirmation: answer.pendingConfirmation,
          confirmationState: answer.pendingConfirmation ? 'open' : undefined,
        });
      } catch (error) {
        const message =
          error instanceof AssistantError
            ? error.message
            : 'Something went wrong. Please try again.';
        patchMessage(assistantId, {
          status: 'error',
          error: message,
          progress: undefined,
          text: undefined,
        });
      } finally {
        busyRef.current = false;
        setIsBusy(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [patchMessage]
  );

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const question = input.trim();
    if (!question || isBusy) return;
    setInput('');
    void ask(question);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const stop = () => abortRef.current?.abort();

  const approve = (message: ChatMessage) => {
    if (!message.pendingConfirmation || !message.question) return;
    patchMessage(message.id, { confirmationState: 'approved' });
    void ask(message.question, {
      confirmation: {
        token: message.pendingConfirmation.token,
        approved: true,
      },
    });
  };

  const decline = (message: ChatMessage) =>
    patchMessage(message.id, { confirmationState: 'declined' });

  const retry = (message: ChatMessage) => {
    if (!message.question) return;
    setMessages(prev => prev.filter(item => item.id !== message.id));
    void ask(message.question, { echo: false });
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    sessionRef.current = null;
    clearConversation();
    inputRef.current?.focus();
  };

  const open = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const close = () => setIsOpen(false);

  return (
    <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>
      {isOpen && (
        <section
          role='dialog'
          aria-label='BetterGov Chatbot'
          aria-modal={isCompact || undefined}
          onKeyDown={event => {
            if (event.key === 'Escape') close();
          }}
          className='fixed inset-x-0 top-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-white sm:static sm:mb-4 sm:h-[min(38rem,calc(100vh-8rem))] sm:w-[26rem] sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl md:w-[30rem]'
          style={
            viewport
              ? { height: viewport.height, top: viewport.top }
              : undefined
          }
        >
          <header className='flex items-center justify-between bg-primary-600 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:pt-3'>
            <div className='flex items-center gap-2.5'>
              <div className='rounded-lg bg-white/20 p-1.5'>
                <Bot size={20} aria-hidden='true' />
              </div>
              <div className='leading-tight'>
                <div className='flex items-center gap-2 text-sm font-semibold tracking-tight'>
                  BetterGov Chatbot
                  <span className='rounded-sm bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.12em] text-primary-700'>
                    Beta
                  </span>
                </div>
                <div className='text-[11px] text-white/80'>
                  Powered by eGovAI
                </div>
              </div>
            </div>
            <div className='flex items-center gap-1'>
              {messages.length > 0 && (
                <button
                  type='button'
                  onClick={reset}
                  aria-label='Start a new conversation'
                  title='Start a new conversation'
                  className='rounded-full p-1.5 transition-colors hover:bg-white/10'
                >
                  <RotateCcw size={16} aria-hidden='true' />
                </button>
              )}
              <button
                type='button'
                onClick={close}
                aria-label='Close'
                title='Close'
                className='rounded-full p-1.5 transition-colors hover:bg-white/10'
              >
                <X size={18} aria-hidden='true' />
              </button>
            </div>
          </header>

          <div
            ref={logRef}
            role='log'
            aria-live='polite'
            aria-relevant='additions text'
            className='flex-1 space-y-4 overflow-y-auto px-4 py-4'
          >
            <AssistantRow>
              <Bubble role='assistant'>
                Hello! Ask me about Philippine government services —
                requirements, steps, fees, offices and hotlines.
              </Bubble>
            </AssistantRow>

            {messages.length === 0 && (
              <div className='flex flex-wrap gap-2 pl-10'>
                {SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    type='button'
                    onClick={() => void ask(suggestion)}
                    disabled={isBusy}
                    className='rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-left text-xs font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100 disabled:opacity-50'
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map(message =>
              message.role === 'user' ? (
                <div key={message.id} className='flex justify-end'>
                  <Bubble role='user'>{message.text}</Bubble>
                </div>
              ) : (
                <AssistantRow key={message.id}>
                  <AssistantMessage
                    message={message}
                    onApprove={() => approve(message)}
                    onDecline={() => decline(message)}
                    onRetry={() => retry(message)}
                    isBusy={isBusy}
                  />
                </AssistantRow>
              )
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className='border-t border-gray-200 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:pb-3'
          >
            <div className='flex items-end gap-2 rounded-xl bg-gray-50 px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500'>
              <label htmlFor='govph-chatbot-input' className='sr-only'>
                Ask a question
              </label>
              <textarea
                id='govph-chatbot-input'
                ref={inputRef}
                rows={1}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Ask about passports, IDs, benefits, permits…'
                maxLength={4000}
                className='max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-500 field-sizing-content'
              />
              {isBusy ? (
                <button
                  type='button'
                  onClick={stop}
                  aria-label='Stop generating'
                  title='Stop'
                  className='rounded-lg bg-gray-800 p-2 text-white transition-colors hover:bg-black'
                >
                  <Square size={14} aria-hidden='true' />
                </button>
              ) : (
                <button
                  type='submit'
                  aria-label='Send question'
                  title='Send'
                  disabled={!input.trim()}
                  className='rounded-lg bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  <Send size={14} aria-hidden='true' />
                </button>
              )}
            </div>
            <p className='mt-2 px-1 text-[11px] leading-snug text-gray-500'>
              Answers are AI-generated and can be wrong. Confirm with the agency
              before acting on them.
            </p>
          </form>
        </section>
      )}

      <button
        type='button'
        onClick={() => (isOpen ? close() : open())}
        aria-label={
          isOpen ? 'Close BetterGov Chatbot' : 'Open BetterGov Chatbot'
        }
        aria-expanded={isOpen}
        className={cn(
          'group flex items-center justify-center rounded-full bg-primary-600 p-4 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-primary-700 active:scale-95',
          isOpen && 'rotate-90 bg-gray-800 hover:bg-black max-sm:hidden'
        )}
      >
        {isOpen ? (
          <X size={24} aria-hidden='true' />
        ) : (
          <span className='relative'>
            <Sparkles
              size={24}
              aria-hidden='true'
              className='group-hover:animate-pulse'
            />
            <span className='absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-primary-600 bg-secondary-500' />
          </span>
        )}
      </button>
    </div>
  );
};

const AssistantRow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className='flex gap-2'>
    <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-50'>
      <Bot size={14} className='text-primary-600' aria-hidden='true' />
    </div>
    <div className='min-w-0 max-w-[88%] flex-1'>{children}</div>
  </div>
);

const Bubble: React.FC<{
  role: 'user' | 'assistant';
  children: React.ReactNode;
  className?: string;
}> = ({ role, children, className }) => (
  <div
    className={cn(
      'inline-block max-w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
      role === 'user'
        ? 'whitespace-pre-wrap rounded-tr-sm bg-primary-600 text-white'
        : 'rounded-tl-sm bg-gray-100 text-gray-800',
      className
    )}
  >
    {children}
  </div>
);

const AssistantMessage: React.FC<{
  message: ChatMessage;
  isBusy: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onRetry: () => void;
}> = ({ message, isBusy, onApprove, onDecline, onRetry }) => {
  if (message.status === 'pending') {
    return (
      <Bubble role='assistant' className='block'>
        {message.text ? (
          <div className='whitespace-pre-wrap'>{message.text}</div>
        ) : null}
        <div
          className={cn(
            'flex items-center gap-2 text-xs text-gray-500',
            message.text && 'mt-2'
          )}
        >
          <Loader2 size={14} className='animate-spin' aria-hidden='true' />
          <span>{message.progress ?? 'Writing the answer'}</span>
        </div>
      </Bubble>
    );
  }

  if (message.status === 'error') {
    return (
      <Bubble
        role='assistant'
        className='block border border-error-200 bg-error-50 text-error-800'
      >
        <p>{message.error}</p>
        {message.question && (
          <button
            type='button'
            onClick={onRetry}
            disabled={isBusy}
            className='mt-2 text-xs font-semibold text-error-700 underline underline-offset-2 hover:text-error-900 disabled:opacity-50'
          >
            Try again
          </button>
        )}
      </Bubble>
    );
  }

  return (
    <div className='space-y-2'>
      {message.html && (
        <Bubble role='assistant' className='block overflow-x-auto'>
          <div
            className='assistant-answer'
            // Sanitised in lib/assistant.ts: dedicated DOMPurify instance with a
            // tag/attribute allow-list and an iframe host allow-list.
            dangerouslySetInnerHTML={{ __html: message.html }}
          />
        </Bubble>
      )}

      {message.pendingConfirmation && (
        <div className='rounded-xl border border-accent-200 bg-accent-50 p-3 text-sm text-gray-800'>
          <div className='flex items-start gap-2'>
            <ShieldCheck
              size={16}
              className='mt-0.5 flex-shrink-0 text-accent-700'
              aria-hidden='true'
            />
            <div className='min-w-0 flex-1'>
              <p className='font-medium'>Approval needed</p>
              <p className='mt-0.5 text-gray-700'>
                {message.pendingConfirmation.message}
              </p>
              {message.confirmationState === 'open' && (
                <div className='mt-2.5 flex gap-2'>
                  <button
                    type='button'
                    onClick={onApprove}
                    disabled={isBusy}
                    className='rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50'
                  >
                    Approve
                  </button>
                  <button
                    type='button'
                    onClick={onDecline}
                    disabled={isBusy}
                    className='rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50'
                  >
                    Not now
                  </button>
                </div>
              )}
              {message.confirmationState === 'approved' && (
                <p className='mt-2 text-xs font-medium text-success-700'>
                  Approved
                </p>
              )}
              {message.confirmationState === 'declined' && (
                <p className='mt-2 text-xs font-medium text-gray-600'>
                  Not approved. Ask something else whenever you are ready.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovPhChatbot;
