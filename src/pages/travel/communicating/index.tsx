import { FC, ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  BedDouble,
  BookOpen,
  Bus,
  Globe,
  Hash,
  MessageCircle,
  Navigation,
  Printer,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import { phrasesData } from './phrasesData';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import Button from '../../../components/v2/ui/Button';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';

type Language = 'english' | 'chinese' | 'korean' | 'japanese' | 'arabic';

const languageLabel: Record<Language, string> = {
  english: 'English',
  chinese: '中文 Chinese',
  korean: '한국어 Korean',
  japanese: '日本語 Japanese',
  arabic: 'العربية Arabic',
};

const categoryIcons: Record<string, ReactNode> = {
  Greetings: <MessageCircle size={14} />,
  'Basic Phrases': <BookOpen size={14} />,
  'At the Restaurant': <Utensils size={14} />,
  Shopping: <ShoppingBag size={14} />,
  Transportation: <Bus size={14} />,
  'Hotel/Accommodation': <BedDouble size={14} />,
  Directions: <Navigation size={14} />,
  Emergency: <AlertCircle size={14} />,
  'Numbers & Money': <Hash size={14} />,
};

const CommunicatingPage: FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>('all');
  const [lang, setLang] = useState<Language>('english');

  const filtered = useMemo(
    () =>
      active === 'all'
        ? phrasesData
        : phrasesData.filter(c => c.category === active),
    [active]
  );

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased print:bg-white'>
      <Helmet>
        <title>Travel Phrasebook | BETTERGOV.PH</title>
        <meta
          name='description'
          content='Essential phrases for travellers to the Philippines — translated between English, Chinese, Korean, Japanese, Arabic, Tagalog, and Bisaya.'
        />
      </Helmet>

      <div className='print:hidden'>
        <PageMasthead
          variant='hero'
          title='Essential phrases'
          lede='Greetings, directions, food, emergencies — written in Tagalog and Bisaya alongside your language of choice. Print a copy to carry, or browse by topic.'
        >
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <label
              htmlFor='language-select'
              className='inline-flex items-center gap-3 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-white/80'
            >
              Foreign language
            </label>
            <select
              id='language-select'
              value={lang}
              onChange={e => setLang(e.target.value as Language)}
              className='cursor-pointer border border-white/40 bg-transparent px-4 py-2.5 font-serif-ed text-[15px] text-white outline-none [&>option]:text-ed-ink'
            >
              {(Object.entries(languageLabel) as [Language, string][]).map(
                ([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                )
              )}
            </select>
            <Button
              as='button'
              variant='ghost'
              onClick={() =>
                navigate(`/travel/communicating/print?lang=${lang}`)
              }
              className='!border-white !text-white hover:!bg-white hover:!text-ed-navy-ink'
            >
              <Printer size={14} />
              <span>Print version</span>
            </Button>
          </div>
        </PageMasthead>
      </div>

      {/* Print-only header */}
      <header className='hidden print:block px-6 pb-4 pt-8'>
        <h1 className='font-serif-ed text-[36px] font-semibold text-ed-ink'>
          Travel Phrasebook
        </h1>
        <p className='mt-1 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
          {languageLabel[lang]} · Tagalog · Bisaya
        </p>
      </header>

      {/* Category tabs */}
      <section className='border-b border-ed-rule bg-white print:hidden'>
        <Container className='flex flex-wrap py-3'>
          <CategoryPill
            active={active === 'all'}
            onClick={() => setActive('all')}
            icon={<Globe size={14} />}
            label='All phrases'
          />
          {phrasesData.map(c => (
            <CategoryPill
              key={c.category}
              active={active === c.category}
              onClick={() => setActive(c.category)}
              icon={categoryIcons[c.category] ?? <Globe size={14} />}
              label={c.category}
            />
          ))}
        </Container>
      </section>

      <section className='py-10 print:py-4 max-md:py-6'>
        <Container>
          {filtered.length === 0 ? (
            <div className='border border-dashed border-ed-rule py-16 text-center text-ed-ink-3'>
              <Globe
                size={32}
                className='mx-auto mb-3 opacity-60'
                aria-hidden
              />
              <div className='font-serif-ed text-[22px] text-ed-ink-2'>
                No phrases in this category.
              </div>
            </div>
          ) : (
            <div className='space-y-10 print:space-y-4'>
              {filtered.map((cat, i) => (
                <div
                  key={cat.category}
                  className='break-inside-avoid print:break-inside-avoid'
                >
                  <SectionHeader
                    num={`${String(i + 1).padStart(2, '0')}`}
                    label={cat.category}
                    meta={`${cat.phrases.length} phrases`}
                  />
                  <div className='overflow-x-auto'>
                    <table className='w-full border-collapse font-sans-ed text-sm'>
                      <thead>
                        <tr>
                          <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                            {languageLabel[lang]}
                          </th>
                          {lang !== 'english' && (
                            <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                              English
                            </th>
                          )}
                          <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                            Tagalog
                          </th>
                          <th className='border-y border-ed-ink bg-ed-paper-2 px-4 py-3 text-left font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
                            Bisaya
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.phrases.map((p, j) => (
                          <tr
                            key={j}
                            className='border-b border-ed-rule transition-colors hover:bg-ed-paper-2/60 print:break-inside-avoid'
                          >
                            <td className='px-4 py-3 font-serif-ed text-[15px] text-ed-ink'>
                              {p[lang]}
                            </td>
                            {lang !== 'english' && (
                              <td className='px-4 py-3 text-[14px] text-ed-ink-2'>
                                {p.english}
                              </td>
                            )}
                            <td className='px-4 py-3 font-serif-ed text-[15px] text-ed-ink'>
                              {p.tagalog}
                            </td>
                            <td className='px-4 py-3 font-serif-ed text-[15px] text-ed-ink'>
                              {p.visaya}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tips card */}
          <aside className='mt-12 border border-ed-rule-strong bg-ed-paper-2 p-7 print:hidden'>
            <div className='flex items-start gap-3'>
              <Globe
                size={18}
                className='mt-0.5 shrink-0 text-ed-navy'
                aria-hidden
              />
              <div>
                <Eyebrow tone='navy'>Travel tips</Eyebrow>
                <ul className='mt-3 space-y-1.5 text-sm leading-relaxed text-ed-ink-2'>
                  <li>
                    Always learn basic greetings in the local language — it
                    shows respect and opens doors.
                  </li>
                  <li>
                    Keep a physical or digital copy of emergency phrases handy.
                  </li>
                  <li>Use hand gestures and be patient when communicating.</li>
                  <li>
                    Download an offline translation app before travelling to
                    areas with limited internet.
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
};

const CategoryPill: FC<{
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    type='button'
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 border border-ed-rule-strong px-3 py-2 font-mono-ed text-[11px] uppercase tracking-[0.12em] transition-colors mr-2 mb-2',
      active
        ? 'bg-ed-navy text-white border-ed-navy'
        : 'bg-white text-ed-ink-2 hover:border-ed-navy hover:text-ed-navy'
    )}
    aria-pressed={active}
  >
    <span aria-hidden>{icon}</span>
    <span>{label}</span>
  </button>
);

export default CommunicatingPage;
