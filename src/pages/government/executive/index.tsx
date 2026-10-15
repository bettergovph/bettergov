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

const HEADS = [executiveHeads.president, executiveHeads['vice-president']];

const ExecutiveIndex: FC = () => {
  const entries = useMemo(() => entriesByKind('executive'), []);

  return (
    <>
      <Helmet>
        <title>Executive Offices | GOV.PH</title>
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
          <div className='grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-3'>
            {HEADS.map(h => (
              <Link
                key={h.slug}
                to={`/government/executive/${h.slug}`}
                className='group grid grid-cols-[96px_1fr] items-center gap-5 border border-ed-rule bg-white p-5 text-ed-ink no-underline transition-colors hover:border-ed-navy max-md:grid-cols-[72px_1fr] max-md:gap-4 max-md:p-4'
              >
                <img
                  src={h.portrait.thumb}
                  alt=''
                  width={240}
                  height={300}
                  className='aspect-[4/5] w-full border border-ed-rule bg-ed-paper-3 object-cover'
                />
                <span className='min-w-0'>
                  <Eyebrow tone='red'>{h.title}</Eyebrow>
                  <span className='mt-1.5 block font-serif-ed text-[22px] font-semibold leading-tight text-ed-ink group-hover:text-ed-navy max-md:text-lg'>
                    {h.name}
                  </span>
                  <span className='mt-2 inline-flex items-center gap-1.5 text-sm text-ed-navy'>
                    Profile and role <ArrowRightIcon size={14} aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
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
