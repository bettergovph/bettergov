import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { GithubIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import Dropcap from '../../components/v2/ui/Dropcap';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import ArrowLink from '../../components/v2/ui/ArrowLink';

const MAINTAINERS = [
  { name: 'Jason Torres', role: 'Founder & Lead', github: 'jasontorres' },
];

const AboutPage: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>About | BetterGov.ph</title>
      <meta
        name='description'
        content='BetterGov.ph is a volunteer-led civic-tech initiative making Philippine government information transparent, accessible, and well-designed.'
      />
      <meta property='og:title' content='About | BetterGov.ph' />
      <meta
        property='og:description'
        content='BetterGov.ph is a volunteer-led civic-tech initiative making Philippine government information transparent, accessible, and well-designed.'
      />
      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://bettergov.ph/about' />
      <link rel='canonical' href='https://bettergov.ph/about' />
    </Helmet>

    {/* ── Hero ──────────────────────────────────────────────────────────── */}
    <PageMasthead
      variant='hero'
      eyebrow='§ About this site'
      title='About BetterGov.ph'
      lede='A volunteer-led civic-tech project making Philippine government information cleaner, faster, and more useful for everyone.'
    />

    {/* ── Editorial essay ───────────────────────────────────────────────── */}
    <section className='py-14 max-md:py-8 border-b border-ed-rule'>
      <Container>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 max-w-[900px]'>
          {/* Left column */}
          <div>
            <Eyebrow className='mb-4'>Our mission</Eyebrow>
            <Dropcap className='font-serif-ed text-[18px] leading-[1.6] text-ed-ink-2'>
              BetterGov.ph exists because government information in the
              Philippines is scattered, hard to navigate, and often inaccessible
              to ordinary citizens. We consolidate it — hotlines, directories,
              holidays, regions, services — into one fast, well-designed
              reference.
            </Dropcap>
            <p className='mt-5 font-serif-ed text-[18px] leading-[1.6] text-ed-ink-2'>
              We believe that transparency is not a feature — it is the
              foundation of a functioning democracy. Every page we ship is a
              small step toward a government that is legible to the people it
              serves.
            </p>
          </div>

          {/* Right column */}
          <div>
            <Eyebrow className='mb-4'>How we work</Eyebrow>
            <p className='font-serif-ed text-[18px] leading-[1.6] text-ed-ink-2'>
              BetterGov.ph is open source, volunteer-run, and operates
              independently of any government body or political party. We are
              not affiliated with the Republic of the Philippines or any of its
              agencies — we are citizens building tools for citizens.
            </p>
            <p className='mt-5 font-serif-ed text-[18px] leading-[1.6] text-ed-ink-2'>
              Our code is public, our data is sourced from official records, and
              our editorial decisions are made in the open. Pull requests are
              welcome. Ideas are welcome. Scrutiny is especially welcome.
            </p>
          </div>
        </div>
      </Container>
    </section>

    {/* ── Pullquote ─────────────────────────────────────────────────────── */}
    <section className='py-14 max-md:py-8 bg-ed-paper-2 border-b border-ed-rule'>
      <Container>
        <div className='max-w-[700px] mx-auto'>
          <blockquote className='border-l-4 border-ed-navy pl-8 max-md:pl-5'>
            <p className='font-serif-ed text-[26px] max-md:text-[20px] leading-[1.4] text-ed-ink font-normal italic'>
              &ldquo;We&rsquo;re not waiting for permission to make things
              better. The tools exist, the data exists, the people exist — we
              just have to show up and build.&rdquo;
            </p>
            <footer className='mt-6 flex items-center gap-3'>
              <div className='w-px h-8 bg-ed-rule-strong' />
              <div>
                <p className='font-sans-ed text-sm font-medium text-ed-ink'>
                  Volunteer contributor
                </p>
                <p className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3 mt-0.5'>
                  BetterGov.ph community
                </p>
              </div>
            </footer>
          </blockquote>
        </div>
      </Container>
    </section>

    {/* ── Maintainers card ──────────────────────────────────────────────── */}
    <section className='py-14 max-md:py-8 border-b border-ed-rule'>
      <Container>
        <div className='max-w-[900px]'>
          <div className='mb-6 flex items-center gap-4'>
            <Eyebrow>Maintainers</Eyebrow>
            <span className='flex-1 h-px bg-ed-rule' />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {MAINTAINERS.map(m => (
              <div
                key={m.github}
                className='border border-ed-rule bg-white p-5 flex flex-col gap-3'
              >
                <div>
                  <p className='font-serif-ed text-[18px] text-ed-ink leading-tight'>
                    {m.name}
                  </p>
                  <p className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3 mt-1'>
                    {m.role}
                  </p>
                </div>
                <ArrowLink
                  to={`https://github.com/${m.github}`}
                  external
                  className='mt-auto'
                >
                  <GithubIcon size={13} />@{m.github}
                </ArrowLink>
              </div>
            ))}

            {/* Open contributor slot */}
            <div className='border border-dashed border-ed-rule bg-ed-paper-2 p-5 flex flex-col gap-3'>
              <div>
                <p className='font-serif-ed text-[18px] text-ed-ink-3 leading-tight'>
                  You?
                </p>
                <p className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-4 mt-1'>
                  Volunteer contributor
                </p>
              </div>
              <ArrowLink
                to='https://github.com/jasontorres/bettergov-v2'
                external
              >
                Contribute on GitHub
              </ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>

    {/* ── GitHub + License flags ────────────────────────────────────────── */}
    <section className='py-10 max-md:py-6'>
      <Container>
        <div className='max-w-[900px] flex flex-wrap items-center gap-4'>
          <Eyebrow className='mr-2'>Project info</Eyebrow>
          <Flag variant='navy'>
            <GithubIcon size={10} />
            Open source
          </Flag>
          <Flag variant='outline'>CC0 1.0 Public Domain</Flag>
          <Flag variant='outline'>Not affiliated with the Republic</Flag>
          <div className='flex-1 flex justify-end max-sm:justify-start'>
            <ArrowLink
              to='https://github.com/jasontorres/bettergov-v2'
              external
            >
              View source on GitHub
            </ArrowLink>
          </div>
        </div>
      </Container>
    </section>
  </main>
);

export default AboutPage;
