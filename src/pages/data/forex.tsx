import { useState, useEffect, FC } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { fetchForexData } from '../../lib/forex';
import { ForexRate } from '../../types';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import PageMasthead from '../../components/v2/layout/PageMasthead';

const FLAG_MAP: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  CNY: '🇨🇳',
  SEK: '🇸🇪',
  NZD: '🇳🇿',
  MXN: '🇲🇽',
  SGD: '🇸🇬',
  HKD: '🇭🇰',
  NOK: '🇳🇴',
  KRW: '🇰🇷',
  TRY: '🇹🇷',
  RUB: '🇷🇺',
  INR: '🇮🇳',
  BRL: '🇧🇷',
  ZAR: '🇿🇦',
  DKK: '🇩🇰',
  PLN: '🇵🇱',
  TWD: '🇹🇼',
  THB: '🇹🇭',
  MYR: '🇲🇾',
  IDR: '🇮🇩',
  VND: '🇻🇳',
  CZK: '🇨🇿',
  HUF: '🇭🇺',
  ILS: '🇮🇱',
  CLP: '🇨🇱',
  PEN: '🇵🇪',
  COP: '🇨🇴',
  BHD: '🇧🇭',
  KWD: '🇰🇼',
  SAR: '🇸🇦',
  AED: '🇦🇪',
  BND: '🇧🇳',
};

const MAJOR = ['USD', 'EUR', 'JPY', 'GBP', 'CNY'];

const toTitleCase = (s: string) =>
  s
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

const ForexPage: FC = () => {
  const [rates, setRates] = useState<ForexRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [asOf, setAsOf] = useState('');

  useEffect(() => {
    fetchForexData()
      .then(data => {
        setRates(data);
        setAsOf(
          new Date().toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Manila',
          }) + ' PHT'
        );
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setIsLoading(false);
      });
  }, []);

  const majorRates = MAJOR.map(code => rates.find(r => r.code === code)).filter(
    Boolean
  ) as ForexRate[];

  const filtered = rates.filter(
    r =>
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.currency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='hero'
        title='Foreign Exchange'
        lede={
          asOf
            ? `BSP reference rates against the Philippine Peso. As of ${asOf}.`
            : 'BSP reference rates against the Philippine Peso.'
        }
      />

      <section className='py-14 max-md:py-8'>
        <Container>
          {isLoading ? (
            <div className='py-20 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-2 border-ed-rule border-t-ed-navy' />
              <p className='mt-4 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                Loading exchange rates…
              </p>
            </div>
          ) : error ? (
            <div className='border-l-4 border-ed-red bg-ed-paper-2 p-6'>
              <p className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-red mb-1'>
                Data unavailable
              </p>
              <p className='text-sm text-ed-ink-2'>{error}</p>
            </div>
          ) : (
            <>
              {/* Major-currency KPI strip */}
              {majorRates.length > 0 && (
                <div className='mb-12'>
                  <div className='mb-5 border-t-2 border-ed-navy pt-4'>
                    <Eyebrow tone='navy'>Major currencies</Eyebrow>
                  </div>
                  <div className='grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2'>
                    {majorRates.map(r => (
                      <div
                        key={r.code}
                        className='border border-ed-rule bg-white p-5'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
                            {r.code}
                          </div>
                          <span className='text-base leading-none'>
                            {FLAG_MAP[r.code] ?? '🏴'}
                          </span>
                        </div>
                        <div className='mt-3 font-serif-ed text-[28px] font-semibold leading-none text-ed-ink'>
                          {r.rate ? `₱${r.rate.toFixed(2)}` : '—'}
                        </div>
                        <div className='mt-1.5 text-[11px] text-ed-ink-3'>
                          {toTitleCase(r.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full FX table */}
              <div className='mb-5 flex items-center justify-between gap-4 border-t-2 border-ed-navy pt-4 max-sm:flex-col max-sm:items-start'>
                <Eyebrow tone='navy'>All currencies</Eyebrow>
                {/* Search */}
                <div className='relative'>
                  <SearchIcon
                    size={13}
                    className='absolute left-2.5 top-1/2 -translate-y-1/2 text-ed-ink-3'
                  />
                  <input
                    type='text'
                    placeholder='Search…'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className='w-48 border border-ed-rule bg-white py-1.5 pl-7 pr-7 font-sans-ed text-sm text-ed-ink placeholder:text-ed-ink-4 focus:border-ed-ink focus:outline-none'
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className='absolute right-2.5 top-1/2 -translate-y-1/2 text-ed-ink-3 hover:text-ed-ink'
                    >
                      <XIcon size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Column headers */}
              <div className='grid grid-cols-[32px_80px_1fr_140px] border-b border-ed-rule pb-2 max-sm:hidden'>
                {['', 'Code', 'Currency', 'PHP Rate'].map(h => (
                  <div
                    key={h}
                    className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div className='divide-y divide-ed-rule'>
                {filtered.length === 0 ? (
                  <p className='py-8 text-center text-sm text-ed-ink-3'>
                    No currencies match &ldquo;{search}&rdquo;.
                  </p>
                ) : (
                  filtered.map(r => (
                    <div
                      key={r.code}
                      className='grid grid-cols-[32px_80px_1fr_140px] items-center py-3 max-sm:grid-cols-1 max-sm:gap-0.5 max-sm:py-3.5'
                    >
                      <div className='text-base leading-none max-sm:hidden'>
                        {FLAG_MAP[r.code] ?? '🏴'}
                      </div>
                      <div className='font-mono-ed text-[13px] font-medium uppercase tracking-[0.1em] text-ed-ink'>
                        {r.code}
                      </div>
                      <div className='text-sm text-ed-ink-2'>
                        {toTitleCase(r.currency)}
                      </div>
                      <div className='font-serif-ed text-[18px] font-semibold text-ed-ink max-sm:font-sans-ed max-sm:text-sm'>
                        {r.rate ? `₱${r.rate.toFixed(4)}` : '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Source note */}
              <div className='mt-12 border-t border-ed-rule pt-5'>
                <p className='text-[12px] text-ed-ink-3'>
                  <span className='font-mono-ed uppercase tracking-[0.12em]'>
                    Source
                  </span>{' '}
                  Exchange rates published by the{' '}
                  <a
                    href='https://www.bsp.gov.ph/SitePages/Statistics/ExchangeRate.aspx'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-ed-navy hover:underline'
                  >
                    Bangko Sentral ng Pilipinas (BSP)
                  </a>{' '}
                  as the official Philippine reference rates. For transactions,
                  consult your bank or authorised forex dealer.
                </p>
              </div>
            </>
          )}
        </Container>
      </section>
    </main>
  );
};

export default ForexPage;
