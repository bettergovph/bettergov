import { FC, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { entriesByKind } from '../../../lib/directory';
import { executiveHeads } from '../../../data/directory/executive-heads';
import PageMasthead from '../../../components/v2/layout/PageMasthead';
import DirectoryResults from '../../../components/v2/directory/DirectoryResults';
import Container from '../../../components/v2/ui/Container';
import Eyebrow from '../../../components/v2/ui/Eyebrow';

const president = executiveHeads.president;
const vicePresident = executiveHeads['vice-president'];

const ExecutiveIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('executive'), []);

  return (
    <>
      <Helmet>
        <title>Executive Offices | BETTERGOV.PH</title>
        <meta
          name='description'
          content='Offices, bureaus, and councils under the Executive branch of the Philippine government — from the Office of the President to independent boards and commissions.'
        />
      </Helmet>
      <PageMasthead
        variant='hero'
        title='Executive offices'
        lede='The Office of the President, the Office of the Vice President, the Presidential Communications Office, and the constellation of boards, councils, authorities, and commissions under the Executive branch.'
      />
      <section
        aria-label='Heads of the Executive branch'
        className='pt-10 max-md:pt-6'
      >
        <Container>
          <div className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 max-lg:grid-cols-1 max-md:gap-3'>
            <Link
              to={`/government/executive/${president.slug}`}
              className='group relative isolate grid grid-cols-[minmax(170px,240px)_minmax(0,1fr)] overflow-hidden bg-primary-900 text-white no-underline max-sm:grid-cols-[120px_minmax(0,1fr)]'
            >
              <img
                src={president.portrait.src}
                alt=''
                width={president.portrait.width}
                height={president.portrait.height}
                className='h-full w-full bg-primary-800 object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]'
              />
              <span aria-hidden className='absolute inset-x-0 top-0 flex h-1'>
                <span className='flex-1 bg-ed-navy' />
                <span className='flex-1 bg-ed-red' />
                <span className='flex-1 bg-ed-gold' />
              </span>
              <span className='relative flex min-w-0 flex-col justify-between gap-8 p-8 max-md:p-6 max-sm:gap-4 max-sm:p-4'>
                <span
                  aria-hidden
                  className='pointer-events-none absolute -bottom-[0.22em] right-2 -z-10 select-none font-serif-ed text-[200px] font-bold leading-none tracking-[-0.06em] text-white/[0.05] max-sm:hidden'
                >
                  {president.ordinal.match(/^\d+/)?.[0]}
                </span>
                <span>
                  <span className='block font-mono-ed text-[11px] font-medium uppercase tracking-[0.2em] text-ed-gold'>
                    {president.title}
                  </span>
                  <span className='mt-3 block font-serif-ed text-[clamp(30px,3.6vw,46px)] font-bold leading-[1] tracking-[-0.03em] text-white max-sm:text-[24px]'>
                    {president.name}
                  </span>
                  <span className='mt-3 block text-[15px] text-white/70 max-sm:text-[13px]'>
                    {president.ordinal} · Term ends{' '}
                    {
                      president.keyFacts.find(f => f.label === 'Term ends')
                        ?.value
                    }
                  </span>
                </span>
                <span className='inline-flex items-center gap-2 text-sm font-medium text-white'>
                  <span className='border-b border-white/40 pb-0.5 group-hover:border-white'>
                    Profile and role
                  </span>
                  <ArrowRightIcon
                    size={15}
                    aria-hidden
                    className='transition-transform group-hover:translate-x-1'
                  />
                </span>
              </span>
            </Link>

            <Link
              to={`/government/executive/${vicePresident.slug}`}
              className='group grid grid-cols-[minmax(110px,150px)_minmax(0,1fr)] overflow-hidden border border-ed-rule bg-white text-ed-ink no-underline transition-colors hover:border-ed-navy max-sm:grid-cols-[120px_minmax(0,1fr)]'
            >
              <img
                src={vicePresident.portrait.src}
                alt=''
                width={vicePresident.portrait.width}
                height={vicePresident.portrait.height}
                className='h-full w-full bg-ed-paper-3 object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]'
              />
              <span className='flex min-w-0 flex-col justify-between gap-6 p-6 max-md:p-5 max-sm:gap-4 max-sm:p-4'>
                <span>
                  <Eyebrow tone='red'>{vicePresident.title}</Eyebrow>
                  <span className='mt-3 block font-serif-ed text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-ed-ink group-hover:text-ed-navy max-sm:text-[22px]'>
                    {vicePresident.name}
                  </span>
                  <span className='mt-3 block text-[14px] text-ed-ink-2 max-sm:text-[13px]'>
                    {vicePresident.ordinal} · Term ends{' '}
                    {
                      vicePresident.keyFacts.find(f => f.label === 'Term ends')
                        ?.value
                    }
                  </span>
                </span>
                <span className='inline-flex items-center gap-1.5 text-sm font-medium text-ed-navy'>
                  Profile and role{' '}
                  <ArrowRightIcon
                    size={14}
                    aria-hidden
                    className='transition-transform group-hover:translate-x-1'
                  />
                </span>
              </span>
            </Link>
          </div>
        </Container>
      </section>
      <DirectoryResults
        entries={entries}
        searchPlaceholder='Search executive offices by name or head'
        countNoun='offices'
      />
    </>
  );
};

export default ExecutiveIndex;
