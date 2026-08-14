import { FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PrinterIcon } from 'lucide-react';
import { phrasesData } from './phrasesData';
import Button from '../../../components/v2/ui/Button';

type Language = 'english' | 'chinese' | 'korean' | 'japanese' | 'arabic';

const languageLabel: Record<Language, string> = {
  english: 'English',
  chinese: '中文 Chinese',
  korean: '한국어 Korean',
  japanese: '日本語 Japanese',
  arabic: 'العربية Arabic',
};

const CommunicatingPrintPage: FC = () => {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState<Language>('english');

  useEffect(() => {
    const q = searchParams.get('lang') as Language | null;
    if (q && q in languageLabel) setLang(q);
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>Travel Phrasebook · Print | BetterGov.ph</title>
      </Helmet>

      {/* Hide site chrome when printing */}
      <style>{`
        @media print {
          nav, footer, header.masthead, .masthead, [data-v2-mast], body > div > nav, body > div > footer {
            display: none !important;
          }
          body { margin: 0; padding: 0; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        {/* Screen header */}
        <header className='border-b border-ed-ink bg-ed-paper-2 py-8 print:hidden'>
          <div className='mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-[18px] md:px-6 xl:px-8'>
            <div>
              <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                § Travel · Printable phrasebook
              </div>
              <h1 className='mt-1 font-serif-ed text-[36px] font-semibold leading-tight text-ed-ink'>
                Travel Phrasebook
              </h1>
              <p className='mt-1 text-sm text-ed-ink-2'>
                BetterGov.ph · {languageLabel[lang]} · Tagalog · Bisaya
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <label
                htmlFor='print-lang'
                className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'
              >
                Language
              </label>
              <select
                id='print-lang'
                value={lang}
                onChange={e => setLang(e.target.value as Language)}
                className='cursor-pointer border border-ed-ink bg-white px-3 py-2 font-sans-ed text-[14px] text-ed-ink outline-none'
              >
                {(Object.entries(languageLabel) as [Language, string][]).map(
                  ([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                )}
              </select>
              <Button as='button' onClick={() => window.print()}>
                <PrinterIcon size={14} />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Print-only banner */}
        <div className='hidden print:block border-b-2 border-ed-navy px-6 pb-3 pt-4'>
          <div className='flex items-baseline justify-between gap-4'>
            <h1 className='font-serif-ed text-[26px] font-semibold text-ed-ink'>
              Travel Phrasebook
            </h1>
            <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
              BetterGov.ph · {languageLabel[lang]} · Tagalog · Bisaya
            </div>
          </div>
        </div>

        <div className='mx-auto max-w-[1360px] space-y-8 px-[18px] py-8 md:px-6 xl:px-8 print:space-y-3 print:px-4 print:py-3'>
          {phrasesData.map(cat => (
            <section
              key={cat.category}
              className='break-inside-avoid border border-ed-rule print:break-inside-avoid'
            >
              <header className='border-b-2 border-ed-navy bg-ed-paper-2 px-4 py-2.5 print:py-1.5'>
                <h2 className='m-0 font-serif-ed text-[18px] font-semibold text-ed-navy-ink print:text-[15px]'>
                  {cat.category}
                </h2>
              </header>
              <table className='w-full border-collapse font-sans-ed text-[13px] print:text-[11px]'>
                <thead>
                  <tr>
                    <th className='border-b border-ed-rule bg-ed-paper-2 px-3 py-2 text-left font-mono-ed text-[10px] font-medium uppercase tracking-[0.12em] text-ed-ink-2 print:py-1'>
                      {languageLabel[lang]}
                    </th>
                    {lang !== 'english' && (
                      <th className='border-b border-ed-rule bg-ed-paper-2 px-3 py-2 text-left font-mono-ed text-[10px] font-medium uppercase tracking-[0.12em] text-ed-ink-2 print:py-1'>
                        English
                      </th>
                    )}
                    <th className='border-b border-ed-rule bg-ed-paper-2 px-3 py-2 text-left font-mono-ed text-[10px] font-medium uppercase tracking-[0.12em] text-ed-ink-2 print:py-1'>
                      Tagalog
                    </th>
                    <th className='border-b border-ed-rule bg-ed-paper-2 px-3 py-2 text-left font-mono-ed text-[10px] font-medium uppercase tracking-[0.12em] text-ed-ink-2 print:py-1'>
                      Bisaya
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cat.phrases.map((p, i) => (
                    <tr
                      key={i}
                      className='border-b border-ed-rule last:border-b-0'
                    >
                      <td className='px-3 py-2 font-serif-ed text-ed-ink print:py-1'>
                        {p[lang]}
                      </td>
                      {lang !== 'english' && (
                        <td className='px-3 py-2 text-ed-ink-2 print:py-1'>
                          {p.english}
                        </td>
                      )}
                      <td className='px-3 py-2 font-serif-ed text-ed-ink print:py-1'>
                        {p.tagalog}
                      </td>
                      <td className='px-3 py-2 font-serif-ed text-ed-ink print:py-1'>
                        {p.visaya}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        {/* Screen tip */}
        <div className='mx-auto max-w-[1360px] px-[18px] pb-10 md:px-6 xl:px-8 print:hidden'>
          <div className='border border-ed-rule-strong bg-ed-paper-2 p-5'>
            <p className='text-sm text-ed-ink-2'>
              <strong className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy'>
                Tip ·
              </strong>{' '}
              Use your browser&rsquo;s print function (Ctrl/Cmd + P) to save
              this as a PDF to your phone or print it out for offline use while
              travelling.
            </p>
          </div>
        </div>

        <div className='hidden print:block mx-auto max-w-[1360px] border-t border-ed-rule px-6 pt-2'>
          <p className='text-center font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
            Generated from BetterGov.ph · Travel Phrasebook · Personal use only
          </p>
        </div>
      </main>
    </>
  );
};

export default CommunicatingPrintPage;
