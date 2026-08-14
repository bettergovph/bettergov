import { FC, ReactNode } from 'react';
import Container from '../../../components/v2/ui/Container';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import { cn } from '../../../lib/utils';

const languages = [
  {
    name: 'Tagalog',
    spk: '28M native · 82M total',
    region:
      'Basis for Filipino, the national language. Dominant in Metro Manila, Central & Southern Luzon.',
  },
  {
    name: 'Cebuano (Bisaya)',
    spk: '27M native',
    region:
      'Central Visayas, Negros Oriental, most of Mindanao. The lingua franca of the south.',
  },
  {
    name: 'Ilocano',
    spk: '10M native',
    region: 'Ilocos region, Cordillera, parts of Cagayan Valley and Mindanao.',
  },
  {
    name: 'Hiligaynon (Ilonggo)',
    spk: '9M native',
    region: 'Western Visayas, Iloilo, Negros Occidental, Capiz, Guimaras.',
  },
  {
    name: 'Waray',
    spk: '3.6M native',
    region: 'Eastern Visayas — Samar, Leyte, Biliran.',
  },
  {
    name: 'Kapampangan',
    spk: '2.9M native',
    region: 'Pampanga, Tarlac, Bataan.',
  },
  {
    name: 'Bikol',
    spk: '2.5M native',
    region: 'Bicol region, southern Luzon.',
  },
  {
    name: 'Chavacano',
    spk: '0.7M native',
    region:
      'Zamboanga. A Spanish-based creole, the only Spanish creole in Asia.',
  },
];

const fiestas = [
  {
    month: 'Jan · 3rd Sun',
    where: 'Cebu City',
    name: 'Sinulog',
    blurb:
      "Honors the Santo Niño with street dances performed to rolling drums; the word means 'like water current.'",
  },
  {
    month: 'Jan · 3rd Sat',
    where: 'Kalibo, Aklan',
    name: 'Ati-Atihan',
    blurb:
      "The 'mother of all Philippine festivals.' Revelers paint themselves with soot in tribute to the Aeta people.",
  },
  {
    month: 'Jan · 4th Sun',
    where: 'Iloilo City',
    name: 'Dinagyang',
    blurb:
      "Tribal dance competitions, religious processions, and food tripping along Iloilo's riverfront.",
  },
  {
    month: 'Feb',
    where: 'Baguio',
    name: 'Panagbenga',
    blurb:
      "'Season of blooming' — a month-long flower festival in the Cordillera summer capital.",
  },
  {
    month: 'May',
    where: 'Quezon Province',
    name: 'Pahiyas',
    blurb:
      'Homes are decorated with rice wafers (kiping), fruit, and vegetables in thanks for the harvest.',
  },
  {
    month: 'Aug',
    where: 'Davao',
    name: 'Kadayawan',
    blurb:
      'A celebration of good harvest, native tribes, and the fruits of Mindanao — durian, mangosteen, pomelo.',
  },
];

const foods = [
  {
    t: 'Adobo',
    o: 'National · widespread',
    d: 'Pork or chicken stewed in vinegar, soy, garlic, bay leaf. Every family has a slightly different recipe.',
    tone: 'bg-[#f6e6c8]',
  },
  {
    t: 'Sinigang',
    o: 'Nationwide',
    d: 'A tamarind-soured soup with pork, shrimp, or fish. The sourness is a defining feature of Filipino cooking.',
    tone: 'bg-[#e6f4e0]',
  },
  {
    t: 'Lechon',
    o: 'Cebu · nationwide',
    d: 'Whole spit-roasted pig. Essential at every major celebration; the Cebu version is famously well-seasoned.',
    tone: 'bg-[#f3d9c4]',
  },
  {
    t: 'Kare-kare',
    o: 'Central Luzon',
    d: 'Oxtail and vegetables in a thick peanut sauce, served with bagoong — fermented shrimp paste.',
    tone: 'bg-[#ecd8be]',
  },
  {
    t: 'Halo-halo',
    o: 'Nationwide',
    d: 'Shaved ice, sweet beans, jellies, ube, leche flan, evaporated milk. Eaten in the thick of summer heat.',
    tone: 'bg-[#e7d9f0]',
  },
  {
    t: 'Pancit',
    o: 'Chinese-Filipino',
    d: 'Stir-fried noodles in many varieties — palabok, canton, malabon, molo. Traditionally served on birthdays.',
    tone: 'bg-[#f1e4c4]',
  },
  {
    t: 'Bibingka',
    o: 'Nationwide · Christmas',
    d: 'Rice cake with salted egg and cheese, baked in clay pots lined with banana leaves. The smell defines December.',
    tone: 'bg-[#fbf1d6]',
  },
  {
    t: 'Laing',
    o: 'Bicol',
    d: "Dried taro leaves simmered in coconut milk with chilies. One of Bicol's bold, unapologetically spicy staples.",
    tone: 'bg-[#d8e8d0]',
  },
];

const faiths = [
  {
    pct: 79,
    name: 'Roman Catholic',
    note: 'Since 1565',
    bg: 'bg-[#0b4fd9]',
    color: 'text-white',
  },
  {
    pct: 6,
    name: 'Islam',
    note: 'Since 1380',
    bg: 'bg-[#4a7fd6]',
    color: 'text-white',
  },
  {
    pct: 3,
    name: 'Iglesia ni Cristo',
    note: 'Founded 1914',
    bg: 'bg-[#8aaadd]',
    color: 'text-white',
  },
  {
    pct: 2.6,
    name: 'Evangelical',
    note: '20th century',
    bg: 'bg-[#b8c9e5]',
    color: 'text-ed-navy-ink',
  },
  {
    pct: 9.4,
    name: 'Other & unaffiliated',
    note: 'Indigenous, Buddhist',
    bg: 'bg-[#d4dcec]',
    color: 'text-ed-navy-ink',
  },
];

const PhilippinesCulture: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <PageMasthead
      variant='hero'
      eyebrow='§ Philippines · Culture'
      title={
        <>
          A nation of <em className='italic font-normal'>Bayanihan</em>
        </>
      }
      lede='The Philippines is a mosaic — Austronesian at its roots, touched by China and India, shaped by three centuries of Spain and half a century of America, held together by family, faith, and fiesta.'
    />

    <Chapter num='01' label='Languages' title='Over 180 spoken tongues'>
      <Prose>
        <p>
          The Philippines is one of the most linguistically diverse countries on
          earth. More than 180 living languages are spoken across the
          archipelago, nearly all belonging to the Austronesian family that
          stretches from Madagascar to Easter Island.
        </p>
        <p>
          <strong>Filipino</strong>, the national language, is based on Tagalog
          and was constitutionally established in 1987. <strong>English</strong>{' '}
          is the second official language and dominates law, business, science,
          and higher education. In daily life, most Filipinos speak their
          regional language alongside Filipino or English.
        </p>
      </Prose>
      <div className='mt-8 border-t-2 border-ed-navy'>
        {languages.map(l => (
          <div
            key={l.name}
            className='grid grid-cols-[200px_140px_1fr] gap-6 border-b border-ed-rule py-4 max-md:grid-cols-1 max-md:gap-1 max-md:py-3'
          >
            <div className='font-serif-ed text-[17px] text-ed-ink'>
              {l.name}
            </div>
            <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-3'>
              {l.spk}
            </div>
            <div className='text-sm leading-normal text-ed-ink-2'>
              {l.region}
            </div>
          </div>
        ))}
      </div>
    </Chapter>

    <Chapter num='02' label='Fiestas' title='A festival for every week'>
      <Prose>
        <p>
          The Philippine calendar is crowded with fiestas — patronal feasts,
          harvest festivals, town anniversaries, and religious processions. Most
          are Catholic in origin but draw from pre-colonial and indigenous
          traditions of reciprocity, hospitality, and dance.
        </p>
        <p>
          These are not tourist spectacles so much as civic rituals. They close
          schools, fill streets, and bring back OFWs from abroad. A fiesta is
          where a town knows itself.
        </p>
      </Prose>
      <div className='mt-8 grid grid-cols-3 border border-ed-rule bg-white divide-x divide-y divide-ed-rule max-md:grid-cols-1 max-md:divide-x-0'>
        {fiestas.map(f => (
          <div key={f.name} className='p-6'>
            <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
              {f.month}
            </div>
            <h4 className='mt-2 font-serif-ed text-[22px] font-semibold text-ed-navy-ink'>
              {f.name}
            </h4>
            <div className='mt-1 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-2'>
              {f.where}
            </div>
            <p className='mt-3 text-sm leading-normal text-ed-ink-2'>
              {f.blurb}
            </p>
          </div>
        ))}
      </div>
    </Chapter>

    <Chapter num='03' label='Food' title='Sour, salty, sweet, smoked'>
      <Prose>
        <p>
          Filipino cooking is frank about its palate. Vinegar, soy, and
          calamansi brighten almost everything; coconut milk carries
          Bicol&rsquo;s heat; the stew is slow, the pig is roasted whole, and
          rice is at every meal.
        </p>
        <p>
          Few cuisines are as historically layered: Malay baseline, Chinese
          noodle traditions, Spanish colonial dishes that became national
          staples (adobo, escabeche, menudo), and a 20th-century taste for
          American convenience foods.
        </p>
      </Prose>
      <div className='mt-8 grid grid-cols-4 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2'>
        {foods.map(f => (
          <div key={f.t} className='border border-ed-rule bg-white p-5'>
            <div
              className={cn(
                'mb-4 flex h-[88px] items-center justify-center font-serif-ed text-[40px] font-semibold text-ed-navy-ink',
                f.tone
              )}
            >
              {f.t[0]}
            </div>
            <h4 className='font-serif-ed text-xl font-semibold text-ed-navy-ink'>
              {f.t}
            </h4>
            <div className='mt-1 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
              {f.o}
            </div>
            <p className='mt-2.5 text-[13px] leading-normal text-ed-ink-2'>
              {f.d}
            </p>
          </div>
        ))}
      </div>
    </Chapter>

    <Chapter num='04' label='Faith' title='A country of believers' noBorder>
      <Prose>
        <p>
          The Philippines is the third-largest Catholic country in the world, a
          legacy of Spanish colonization that took deep root and shaped
          everything from place names to political rhetoric. Islam predates
          Spanish arrival by over a century and remains strong in Mindanao and
          Sulu. Indigenous faiths persist in the Cordillera and the mountain
          communities of Mindanao.
        </p>
      </Prose>
      <div className='mt-8 grid grid-cols-2 gap-10 max-md:grid-cols-1 max-md:gap-6'>
        <div className='flex flex-col max-md:flex-row max-md:h-[60px]'>
          {faiths.map(f => (
            <div
              key={f.name}
              style={{ flex: f.pct }}
              className={cn(
                'flex items-center justify-center font-mono-ed text-[10px] uppercase tracking-[0.14em]',
                f.bg,
                f.color
              )}
            >
              {f.name}
            </div>
          ))}
        </div>
        <div>
          {faiths.map(f => (
            <div
              key={f.name}
              className='grid grid-cols-[80px_1fr_auto] items-baseline gap-4 border-b border-ed-rule py-3 last:border-b-0'
            >
              <div className='font-serif-ed text-[22px] font-semibold text-ed-navy-ink'>
                {f.pct}%
              </div>
              <div className='font-serif-ed text-[17px] text-ed-ink'>
                {f.name}
              </div>
              <div className='text-right text-xs text-ed-ink-3'>{f.note}</div>
            </div>
          ))}
        </div>
      </div>
    </Chapter>

    {/* Closing pullquote */}
    <section className='mb-20 mt-12'>
      <Container>
        <blockquote className='my-9 max-w-[720px] border-l-[3px] border-ed-navy py-2 pl-6 font-sans-ed text-[28px] italic leading-snug text-ed-navy-ink'>
          &ldquo;A Filipino is somebody who eats with his fingers, travels with
          his whole family, and will not pass you on the sidewalk without
          greeting you.&rdquo;
          <footer className='mt-3 font-mono-ed text-[10px] uppercase tracking-[0.14em] not-italic text-ed-ink-3'>
            — Folk saying, oft-quoted in essays on identity
          </footer>
        </blockquote>
      </Container>
    </section>
  </main>
);

const Chapter: FC<{
  num: string;
  label: string;
  title: string;
  noBorder?: boolean;
  children: ReactNode;
}> = ({ num, label, title, noBorder, children }) => (
  <section>
    <Container>
      <div
        className={cn(
          'grid grid-cols-[180px_1fr] gap-10 py-14 max-lg:grid-cols-1 max-lg:gap-4 max-lg:py-10',
          !noBorder && 'border-b border-ed-rule'
        )}
      >
        <div>
          <div className='font-serif-ed text-[80px] font-semibold leading-none text-ed-navy-ink max-lg:text-[64px]'>
            {num}
          </div>
          <div className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
            {label}
          </div>
        </div>
        <div>
          <h2 className='m-0 font-serif-ed text-[40px] font-semibold leading-tight tracking-[-0.01em] text-ed-navy-ink max-md:text-[32px]'>
            {title}
          </h2>
          {children}
        </div>
      </div>
    </Container>
  </section>
);

const Prose: FC<{ children: ReactNode }> = ({ children }) => (
  <div className='mt-5 [&>p]:mb-4 [&>p]:font-sans-ed [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-ed-ink-2 [&_strong]:font-semibold [&_strong]:text-ed-ink'>
    {children}
  </div>
);

export default PhilippinesCulture;
