import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';
import PageMasthead from '../../../components/v2/layout/PageMasthead';

type Region = {
  code: string;
  name: string;
  cap: string;
  pop: string;
  prov: string;
  note: string;
  slug?: string;
};

const LUZON: Region[] = [
  {
    code: 'NCR',
    name: 'National Capital Region',
    cap: 'Manila',
    pop: '13.5M',
    prov: '— (16 cities + Pateros)',
    note: 'The seat of national government; the most densely populated region in the country.',
    slug: 'national-capital-region',
  },
  {
    code: 'CAR',
    name: 'Cordillera Administrative Region',
    cap: 'Baguio City',
    pop: '1.8M',
    prov: '6',
    note: 'Mountainous highlands of northern Luzon; home to the Ifugao, Kalinga, and Ibaloi peoples.',
    slug: 'cordillera-administrative-region',
  },
  {
    code: 'I',
    name: 'Ilocos Region',
    cap: 'San Fernando (La Union)',
    pop: '5.3M',
    prov: '4',
    note: 'Spanish-era heritage towns; birthplace of two Philippine presidents.',
    slug: 'region-i-ilocos-region',
  },
  {
    code: 'II',
    name: 'Cagayan Valley',
    cap: 'Tuguegarao',
    pop: '3.7M',
    prov: '5',
    note: "The country's longest river, the Cagayan, runs its length.",
    slug: 'region-ii-cagayan-valley',
  },
  {
    code: 'III',
    name: 'Central Luzon',
    cap: 'San Fernando (Pampanga)',
    pop: '13.0M',
    prov: '7',
    note: 'The rice bowl of the Philippines; major industrial and military footprint.',
    slug: 'region-iii-central-luzon',
  },
  {
    code: 'IV-A',
    name: 'CALABARZON',
    cap: 'Calamba',
    pop: '16.9M',
    prov: '5',
    note: 'The most populous region; major manufacturing belt south of Metro Manila.',
    slug: 'region-iva-calabarzon',
  },
  {
    code: 'IV-B',
    name: 'MIMAROPA',
    cap: 'Calapan',
    pop: '3.3M',
    prov: '5',
    note: 'Island provinces — Mindoro, Marinduque, Romblon, Palawan. Includes the Tubbataha Reefs.',
    slug: 'mimaropa-region',
  },
  {
    code: 'V',
    name: 'Bicol Region',
    cap: 'Legazpi',
    pop: '6.1M',
    prov: '6',
    note: "Home to Mayon Volcano's perfect cone and the world's spiciest coconut cooking.",
    slug: 'region-v-bicol-region',
  },
];

const VISAYAS: Region[] = [
  {
    code: 'VI',
    name: 'Western Visayas',
    cap: 'Iloilo City',
    pop: '8.1M',
    prov: '6',
    note: 'Iloilo, Negros Occidental, Antique, Aklan, Capiz, Guimaras. Sugar and heritage towns.',
    slug: 'region-vi-western-visayas',
  },
  {
    code: 'VII',
    name: 'Central Visayas',
    cap: 'Cebu City',
    pop: '8.4M',
    prov: '4',
    note: 'Cebu, Bohol, Negros Oriental, Siquijor. Cebu is the second-biggest urban economy after Manila.',
    slug: 'region-vii-central-visayas',
  },
  {
    code: 'VIII',
    name: 'Eastern Visayas',
    cap: 'Tacloban',
    pop: '4.9M',
    prov: '6',
    note: 'Samar, Leyte, Biliran. Site of Typhoon Yolanda (2013), still rebuilding.',
    slug: 'region-viii-eastern-visayas',
  },
  {
    code: 'NIR',
    name: 'Negros Island Region',
    cap: 'Bacolod',
    pop: '4.5M',
    prov: '2',
    note: 'Re-established in 2024; unifies Negros Occidental and Oriental. The country\u2019s 18th region.',
  },
];

const MINDANAO: Region[] = [
  {
    code: 'IX',
    name: 'Zamboanga Peninsula',
    cap: 'Pagadian',
    pop: '3.9M',
    prov: '3',
    note: "Chavacano-speaking Zamboanga City; the 'Asia\u2019s Latin City.'",
    slug: 'region-ix-zamboanga-peninsula',
  },
  {
    code: 'X',
    name: 'Northern Mindanao',
    cap: 'Cagayan de Oro',
    pop: '5.0M',
    prov: '5',
    note: 'Gateway to Mindanao; Camiguin Island, Dahilayan, and the Maria Cristina Falls.',
    slug: 'region-x-northern-mindanao',
  },
  {
    code: 'XI',
    name: 'Davao Region',
    cap: 'Davao City',
    pop: '5.3M',
    prov: '5',
    note: 'Davao is Mindanao\u2019s largest city; home to Mount Apo, the country\u2019s highest peak.',
    slug: 'region-xi-davao-region',
  },
  {
    code: 'XII',
    name: 'SOCCSKSARGEN',
    cap: 'Koronadal',
    pop: '4.9M',
    prov: '4',
    note: 'South Cotabato, Cotabato, Sultan Kudarat, Sarangani, Gen. Santos — tuna capital of the Philippines.',
    slug: 'region-xii-soccsksargen',
  },
  {
    code: 'XIII',
    name: 'Caraga',
    cap: 'Butuan',
    pop: '2.8M',
    prov: '5',
    note: 'Rivers, rainforests, and the archaeological treasures of Butuan\u2019s balangay boats.',
    slug: 'region-xiiicaraga',
  },
  {
    code: 'BARMM',
    name: 'Bangsamoro',
    cap: 'Cotabato City',
    pop: '4.9M',
    prov: '5',
    note: 'The country\u2019s only autonomous region, with a parliamentary government. Established 2019.',
    slug: 'bangsamoro-autonomous-region-in-muslim-mindanao',
  },
];

const PhilippinesRegions: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <PageMasthead
      variant='hero'
      eyebrow='§ Philippines · Regions'
      title='18 regions, 82 provinces'
      lede='The Philippines is organized into 18 administrative regions grouped under three island divisions. Regions are not local governments in themselves — they coordinate national agency services — but they are how most Filipinos locate themselves.'
    >
      {/* Totals strip */}
      <div className='mt-8 grid grid-cols-4 divide-x divide-white/20 max-sm:grid-cols-2 max-sm:divide-y'>
        {[
          { n: '18', l: 'Regions' },
          { n: '82', l: 'Provinces' },
          { n: '146', l: 'Cities' },
          { n: '1,488', l: 'Municipalities' },
        ].map(t => (
          <div key={t.l} className='px-4 py-4 text-white/85 first:pl-0'>
            <div className='font-serif-ed text-[32px] font-medium leading-none text-white'>
              {t.n}
            </div>
            <div className='mt-1.5 font-mono-ed text-[10px] uppercase tracking-[0.14em] text-white/70'>
              {t.l}
            </div>
          </div>
        ))}
      </div>
    </PageMasthead>

    <Island
      name='Luzon'
      meta={
        <>
          <strong className='text-ed-ink'>8 regions · ~64M people</strong>
          <span className='block text-ed-ink-3'>Northernmost island group</span>
        </>
      }
      intro='The largest and northernmost island group, and the political and economic heart of the country. Contains the National Capital Region (Metro Manila) and the bulk of central government offices, along with the agricultural heartland and the Cordillera highlands.'
      regions={LUZON}
    />
    <Island
      name='Visayas'
      meta={
        <>
          <strong className='text-ed-ink'>4 regions · ~26M people</strong>
          <span className='block text-ed-ink-3'>Central island group</span>
        </>
      }
      intro={
        'The cluster of islands between Luzon and Mindanao, home to some of the country\u2019s oldest settlements and its most visited beaches. The Visayas gave the Philippines its second-largest metropolis (Cebu) and most of its Bisaya-speaking majority.'
      }
      regions={VISAYAS}
    />
    <Island
      name='Mindanao'
      meta={
        <>
          <strong className='text-ed-ink'>6 regions · ~27M people</strong>
          <span className='block text-ed-ink-3'>Southernmost island group</span>
        </>
      }
      intro={
        'The second-largest island and the most culturally diverse. Mindanao hosts the country\u2019s Muslim-majority Bangsamoro region, its most productive fruit-growing provinces, and a Lumad population of indigenous peoples whose traditions predate both Islam and Christianity in the islands.'
      }
      regions={MINDANAO}
      last
    />

    {/* Next cards */}
    <section className='mb-20 mt-16'>
      <Container>
        <div className='grid grid-cols-2 gap-8 max-md:grid-cols-1'>
          <Link
            to='/philippines/map'
            className='block border border-ed-rule bg-white p-8 text-ed-ink no-underline transition-colors hover:border-ed-ink'
          >
            <div className='mb-3'>
              <Eyebrow>Visualize · Interactive map</Eyebrow>
            </div>
            <h3 className='m-0 font-serif-ed text-[28px] font-medium text-ed-navy-ink'>
              See the archipelago at a glance
            </h3>
            <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>
              Major islands, cities, and the seas that surround them — in one
              view.
            </p>
            <div className='mt-4 flex items-center gap-1.5 text-[13px] font-medium text-ed-navy'>
              Open the map <ArrowRightIcon size={14} />
            </div>
          </Link>
          <Link
            to='/government/local'
            className='block border border-ed-rule bg-white p-8 text-ed-ink no-underline transition-colors hover:border-ed-ink'
          >
            <div className='mb-3'>
              <Eyebrow>Directory · Local govt.</Eyebrow>
            </div>
            <h3 className='m-0 font-serif-ed text-[28px] font-medium text-ed-navy-ink'>
              Find your LGU
            </h3>
            <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>
              Contact details for provinces, cities, municipalities, and
              barangays nationwide.
            </p>
            <div className='mt-4 flex items-center gap-1.5 text-[13px] font-medium text-ed-navy'>
              Open the directory <ArrowRightIcon size={14} />
            </div>
          </Link>
        </div>
      </Container>
    </section>
  </main>
);

const Island: FC<{
  name: string;
  meta: ReactNode;
  intro: string;
  regions: Region[];
  last?: boolean;
}> = ({ name, meta, intro, regions, last }) => (
  <section>
    <Container>
      <div className={last ? '' : 'border-b border-ed-rule pb-14 max-md:pb-8'}>
        <div className='mt-14 grid grid-cols-[auto_1fr] items-baseline gap-6 border-t-2 border-ed-navy pt-6 max-md:grid-cols-1 max-md:gap-1 max-md:pt-4'>
          <h2 className='m-0 font-serif-ed text-[48px] font-medium leading-none tracking-[-0.01em] text-ed-navy-ink max-md:text-[36px]'>
            {name}
          </h2>
          <div className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-2'>
            {meta}
          </div>
        </div>
        <p className='mt-6 max-w-[760px] font-sans-ed text-lg leading-relaxed text-ed-ink-2'>
          {intro}
        </p>
        <div className='mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1'>
          {regions.map(r => (
            <RegionCard key={r.code} region={r} />
          ))}
        </div>
      </div>
    </Container>
  </section>
);

const RegionCard: FC<{ region: Region }> = ({ region: r }) => {
  const inner = (
    <div className='relative h-full border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors group-hover:border-ed-ink'>
      <span className='inline-block bg-ed-navy px-2 py-[3px] font-mono-ed text-[10px] font-medium uppercase tracking-[0.14em] text-white'>
        {r.code}
      </span>
      <h3 className='mt-4 font-serif-ed text-[22px] font-medium leading-tight text-ed-navy-ink'>
        {r.name}
      </h3>
      <div className='mt-1.5 text-[13px] text-ed-ink-2'>
        <strong>{r.cap}</strong>
        <span className='text-ed-ink-3'> · Regional center</span>
      </div>
      <p className='mt-3 text-sm leading-normal text-ed-ink-2'>{r.note}</p>
      <div className='mt-5 grid grid-cols-2 gap-3 border-t border-ed-rule pt-3 font-mono-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
        <div>
          <div>Population</div>
          <div className='mt-0.5 font-sans-ed text-[13px] normal-case tracking-normal text-ed-ink'>
            {r.pop}
          </div>
        </div>
        <div>
          <div>Provinces</div>
          <div className='mt-0.5 font-sans-ed text-[13px] normal-case tracking-normal text-ed-ink'>
            {r.prov}
          </div>
        </div>
      </div>
    </div>
  );

  if (r.slug) {
    return (
      <Link to={`/government/local/${r.slug}`} className='group block'>
        {inner}
      </Link>
    );
  }
  return <div className='group block'>{inner}</div>;
};

export default PhilippinesRegions;
