import { FC, FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Footer newsletter sign-up, styled for the dark footer band: mono eyebrow,
 * one short sentence, and a compact underline email field (no focus box).
 * It posts to /api/newsletter, which answers 503 until a maintainer connects
 * an email service, and then this shows an honest "not available" message.
 */
const NewsletterSignup: FC = () => {
  const { t } = useTranslation('common');
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setMessage('');
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: trap }),
      });
      if (response.ok) {
        setStatus('done');
        setEmail('');
        setMessage(
          t(
            'newsletter.success',
            'Thank you. Check your inbox to confirm your subscription.'
          )
        );
        return;
      }
      setStatus('error');
      setMessage(
        response.status === 503
          ? t(
              'newsletter.unavailable',
              'The newsletter is not open yet. Please check back soon.'
            )
          : response.status === 400
            ? t('newsletter.invalid', 'Enter a valid email address.')
            : t(
                'newsletter.failed',
                'We could not subscribe you right now. Please try again.'
              )
      );
    } catch {
      setStatus('error');
      setMessage(
        t(
          'newsletter.failed',
          'We could not subscribe you right now. Please try again.'
        )
      );
    }
  };

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className='grid grid-cols-[1fr_minmax(0,420px)] items-start gap-10 border-b border-white/10 py-10 max-md:grid-cols-1 max-md:gap-6 max-md:py-8'
    >
      <div>
        <h3
          id={`${inputId}-heading`}
          className='mb-3 font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-white'
        >
          {t('newsletter.heading', 'Newsletter')}
        </h3>
        <p className='m-0 max-w-[460px] text-[15px] leading-relaxed text-white/80'>
          {t(
            'newsletter.description',
            'One short email a month: new government data, services and features on BetterGov.'
          )}
        </p>
      </div>
      <form onSubmit={onSubmit} className='relative'>
        <div className='flex items-end gap-3 max-[480px]:flex-col max-[480px]:items-stretch'>
          <div className='min-w-0 flex-1'>
            <label
              htmlFor={inputId}
              className='mb-1 block font-mono-ed text-[11px] uppercase tracking-[0.1em] text-white/70'
            >
              {t('newsletter.emailLabel', 'Email address')}
            </label>
            <input
              id={inputId}
              type='email'
              name='email'
              inputMode='email'
              autoComplete='email'
              required
              maxLength={254}
              value={email}
              onChange={e => setEmail(e.target.value)}
              aria-describedby={message ? messageId : undefined}
              aria-invalid={status === 'error' ? true : undefined}
              placeholder={t('newsletter.placeholder', 'you@example.com')}
              className='h-11 w-full rounded-none border-0 border-b border-white/40 bg-transparent px-0 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white focus-visible:border-white focus-visible:shadow-[0_1px_0_0_#fff]'
            />
          </div>
          {/* Honeypot: hidden from people and assistive technology. */}
          <div aria-hidden='true' className='absolute -left-[9999px]'>
            <label>
              Website
              <input
                type='text'
                name='website'
                tabIndex={-1}
                autoComplete='off'
                value={trap}
                onChange={e => setTrap(e.target.value)}
              />
            </label>
          </div>
          <button
            type='submit'
            disabled={status === 'sending'}
            className={cn(
              'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center border border-white bg-white px-5 font-sans-ed text-sm font-medium text-ed-navy-ink transition-colors hover:bg-ed-navy-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              'disabled:cursor-wait disabled:opacity-70'
            )}
          >
            {status === 'sending'
              ? t('newsletter.sending', 'Subscribing…')
              : t('newsletter.submit', 'Subscribe')}
          </button>
        </div>
        <p
          id={messageId}
          role='status'
          aria-live='polite'
          className={cn(
            'mt-3 min-h-[1.25rem] text-[13px] leading-snug',
            status === 'error' ? 'text-white' : 'text-white/80'
          )}
        >
          {message}
        </p>
        <p className='m-0 text-[12px] leading-snug text-white/60'>
          {t(
            'newsletter.privacy',
            'We use your email only to send this newsletter. Unsubscribe anytime.'
          )}
        </p>
      </form>
    </section>
  );
};

export default NewsletterSignup;
