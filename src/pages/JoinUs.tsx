import { FC } from 'react';
import {
  CodeIcon,
  PenLineIcon,
  Languages,
  PaletteIcon,
  GithubIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { SiDiscord } from '@icons-pack/react-simple-icons';
import { Helmet } from 'react-helmet-async';
import Container from '../components/v2/ui/Container';
import Eyebrow from '../components/v2/ui/Eyebrow';
import Button from '../components/v2/ui/Button';
import PageMasthead from '../components/v2/layout/PageMasthead';

const ROLES = [
  {
    icon: CodeIcon,
    title: 'Engineer',
    desc: 'Build and maintain the open-source platform. React, TypeScript, and civic data APIs.',
    skills: ['React / TypeScript', 'REST APIs', 'Data pipelines'],
  },
  {
    icon: PaletteIcon,
    title: 'Designer',
    desc: 'Shape the editorial visual system, iconography, and accessible UI patterns.',
    skills: [
      'Figma / design systems',
      'Accessibility (WCAG)',
      'Editorial layout',
    ],
  },
  {
    icon: PenLineIcon,
    title: 'Editor',
    desc: 'Write, verify, and maintain the factual content behind every government page.',
    skills: [
      'Research & fact-checking',
      'Plain-language writing',
      'Data sourcing',
    ],
  },
  {
    icon: Languages,
    title: 'Translator',
    desc: 'Localise content into Filipino and regional languages so every citizen can access it.',
    skills: [
      'Filipino / Bisaya / Ilocano',
      'Technical translation',
      'Community review',
    ],
  },
];

const HOW_WE_WORK = [
  {
    label: 'Volunteer-led',
    body: 'Everyone here gives their time freely. No paid staff, no corporate hierarchy.',
  },
  {
    label: 'Open source',
    body: 'All code is public on GitHub under a permissive licence. Fork it, improve it, reuse it.',
  },
  {
    label: 'No ads, no tracking',
    body: 'We collect no analytics, run no ads, and sell no data. Ever.',
  },
  {
    label: 'Public domain data',
    body: 'Our datasets are released under CC0 — free for any purpose, including commercial use.',
  },
];

const JoinUs: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Join Us | BetterGov.ph</title>
      <meta
        name='description'
        content='Join BetterGov.ph—A volunteer-led civic tech initiative building open-source tools to make government more transparent, efficient, and accessible.'
      />
      <link rel='canonical' href='https://bettergov.ph/join-us' />
      <meta property='og:title' content='Join Us | BetterGov.ph' />
      <meta
        property='og:description'
        content='Be part of a volunteer-led civic tech initiative building open-source projects for a better government.'
      />
      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://bettergov.ph/join-us' />
      <meta property='og:image' content='https://bettergov.ph/ph-logo.webp' />
    </Helmet>
    <PageMasthead
      variant='hero'
      title={
        <>
          Join the <span className='italic'>#CivicTech</span> revolution
        </>
      }
      lede='We are volunteer-led builders, writers, and designers making government data open and accessible to every Filipino. No permission needed — just bring your skills.'
    >
      <div className='flex flex-wrap gap-3'>
        <Button
          as='a'
          href='https://discord.gg/mHtThpN8bT'
          target='_blank'
          rel='noopener noreferrer'
          variant='solid'
          size='md'
          className='bg-white text-ed-navy-ink border-white hover:bg-ed-paper-2 hover:border-ed-paper-2'
        >
          <SiDiscord size={15} />
          Join Discord
        </Button>
        <Button
          as='a'
          href='https://github.com/bettergovph/bettergov'
          target='_blank'
          rel='noopener noreferrer'
          variant='ghost'
          size='md'
          className='border-white/60 text-white hover:bg-white hover:text-ed-navy-ink'
        >
          <GithubIcon size={15} />
          View on GitHub
        </Button>
      </div>
    </PageMasthead>

    {/* How we work */}
    <section className='border-b border-ed-rule py-14 max-md:py-8'>
      <Container>
        <div className='mb-8 border-t-2 border-ed-navy pt-5'>
          <Eyebrow tone='navy'>How we work</Eyebrow>
        </div>
        <div className='grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1'>
          {HOW_WE_WORK.map(item => (
            <div key={item.label}>
              <h3 className='font-serif-ed text-[20px] font-semibold text-ed-navy-ink'>
                {item.label}
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-ed-ink-2'>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>

    {/* Roles grid */}
    <section className='py-14 max-md:py-8'>
      <Container>
        <div className='mb-8 border-t-2 border-ed-navy pt-5'>
          <Eyebrow tone='navy'>Open roles</Eyebrow>
        </div>
        <div className='grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-sm:grid-cols-1'>
          {ROLES.map(role => (
            <div
              key={role.title}
              className='border border-ed-rule bg-white p-6'
            >
              <div className='mb-4 inline-flex h-10 w-10 items-center justify-center border border-ed-rule text-ed-navy'>
                <role.icon size={18} />
              </div>
              <h3 className='font-serif-ed text-[22px] font-semibold text-ed-navy-ink'>
                {role.title}
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-ed-ink-2'>
                {role.desc}
              </p>
              <ul className='mt-4 space-y-1 border-t border-ed-rule pt-4'>
                {role.skills.map(s => (
                  <li
                    key={s}
                    className='font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>

    {/* Manifesto band */}
    <section className='bg-ed-navy-ink py-16 max-md:py-10'>
      <Container narrow>
        <div className='mb-6'>
          <Eyebrow tone='onDark'>Why we build</Eyebrow>
        </div>
        <blockquote className='space-y-5 font-sans-ed text-[clamp(18px,2.5vw,26px)] font-normal leading-relaxed text-white/90'>
          <p>We&rsquo;re done waiting for government to modernise itself.</p>
          <p>
            We can contribute in our own ways —&nbsp;
            <strong className='text-white'>no matter how little it is.</strong>
          </p>
          <p>
            Grassroots. Open source.{' '}
            <strong className='text-white'>No permission needed.</strong>
          </p>
        </blockquote>
      </Container>
    </section>

    {/* CTA band */}
    <section className='border-t border-ed-rule py-14 max-md:py-8'>
      <Container>
        <div className='flex items-start justify-between gap-8 max-md:flex-col'>
          <div>
            <div className='mb-3'>
              <Eyebrow tone='navy'>Ready to contribute?</Eyebrow>
            </div>
            <h2 className='font-serif-ed text-[clamp(24px,3vw,36px)] font-bold leading-tight text-ed-ink'>
              Join the community and{' '}
              <span className='text-ed-navy'>start building today.</span>
            </h2>
            <p className='mt-3 max-w-lg text-sm leading-relaxed text-ed-ink-2'>
              Drop into Discord, introduce yourself, and pick up an open issue —
              or simply show up to a Saturday community call.
            </p>
          </div>
          <div className='flex shrink-0 flex-col gap-3 max-md:flex-row'>
            <Button
              as='a'
              href='https://discord.gg/mHtThpN8bT'
              target='_blank'
              rel='noopener noreferrer'
              variant='solid'
              size='md'
            >
              <SiDiscord size={15} />
              Join Discord
            </Button>
            <Button
              as='a'
              href='https://github.com/bettergovph/bettergov/issues'
              target='_blank'
              rel='noopener noreferrer'
              variant='ghost'
              size='md'
            >
              <GithubIcon size={15} />
              Open issues
              <ArrowRightIcon size={13} />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  </main>
);

export default JoinUs;
