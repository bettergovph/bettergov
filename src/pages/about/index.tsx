import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import { GithubIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import Dropcap from '../../components/v2/ui/Dropcap';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import Flag from '../../components/v2/ui/Flag';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import {
  ISSUES_URL,
  REPO_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '../../lib/brand';

const DESCRIPTION =
  'GOV.PH is the proposed portal of the Republic of the Philippines — one place to find government services, agencies, hotlines, and information.';

const AboutPage: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>About | {SITE_NAME}</title>
      <meta name='description' content={DESCRIPTION} />
      <meta property='og:title' content={`About | ${SITE_NAME}`} />
      <meta property='og:description' content={DESCRIPTION} />
      <meta property='og:type' content='website' />
      <meta property='og:url' content={`${SITE_URL}/about`} />
      <meta property='og:image' content={`${SITE_URL}/og-image.png`} />
      <link rel='canonical' href={`${SITE_URL}/about`} />
    </Helmet>

    {/* ── Hero ──────────────────────────────────────────────────────────── */}
    <PageMasthead
      variant='hero'
      title={`About ${SITE_NAME}`}
      lede={`${SITE_TAGLINE}. One place to find government services, agencies, hotlines, and information — written plainly and sourced from official records.`}
    />

    {/* ── Editorial essay ───────────────────────────────────────────────── */}
    <section className='py-14 max-md:py-6 border-b border-ed-rule'>
      <Container>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 max-w-[900px]'>
          <div>
            <SectionHeader label='What this portal is for' />
            <Dropcap className='font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
              Government information in the Philippines is spread across
              hundreds of agency websites. GOV.PH brings it together — services,
              directories, hotlines, holidays, news, and travel requirements —
              so that a citizen can find what they need in one place and get to
              the responsible office quickly.
            </Dropcap>
            <p className='mt-5 max-md:mt-3.5 font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
              Every page points back to its official source. For transactions,
              GOV.PH directs you to the agency that handles them; it does not
              replace their systems or their authority.
            </p>
          </div>

          <div>
            <SectionHeader label='How it is built' />
            <p className='font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
              GOV.PH is developed through a community collaboration partnership
              between eGov Philippines and citizen contributors. The code is
              open source under the MIT License, so any national agency, local
              government unit, or civic project may reuse it. The content is
              published under the Creative Commons
              Attribution-NonCommercial-NoDerivatives 4.0 license (CC BY-NC-ND
              4.0).
            </p>
            <p className='mt-5 max-md:mt-3.5 font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
              Content is drawn from official records and government
              publications. If you find something outdated or incorrect, report
              it through the issue tracker and it will be reviewed against the
              source.
            </p>
            <ArrowLink to={ISSUES_URL} external className='mt-5'>
              Report an error or outdated information
            </ArrowLink>
          </div>
        </div>
      </Container>
    </section>

    {/* ── Origins & attribution ─────────────────────────────────────────── */}
    <section className='py-14 max-md:py-6 bg-ed-paper-2 border-b border-ed-rule'>
      <Container>
        <div className='max-w-[900px]'>
          <SectionHeader label='Origins and attribution' />
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12'>
            <p className='font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
              This portal builds on the open-source BetterGov.ph project, a
              volunteer-led civic-tech initiative that set out to make
              Philippine government information easier to find, read, and use.
              Its code, design system, and data pipelines became the foundation
              of GOV.PH.
            </p>
            <div>
              <p className='font-sans-ed text-[18px] leading-[1.6] text-ed-ink-2 max-md:text-[15px] max-md:leading-[1.5]'>
                The Republic of the Philippines thanks the hundreds of citizen
                volunteers who contributed to that work. Their contributions
                remain in the public domain, and their repository remains
                available for anyone who wants to build on it.
              </p>
              <ArrowLink to='https://bettergov.ph' external className='mt-5'>
                BetterGov.ph
              </ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>

    {/* ── Project info ──────────────────────────────────────────────────── */}
    <section className='py-10 max-md:py-6'>
      <Container>
        <div className='max-w-[900px] flex flex-wrap items-center gap-4'>
          <Eyebrow className='mr-2'>Project info</Eyebrow>
          <Flag variant='navy'>
            <GithubIcon size={10} />
            Open source
          </Flag>
          <Flag variant='outline'>MIT · CC BY-NC-ND 4.0</Flag>
          <Flag variant='outline'>Republic of the Philippines</Flag>
          <div className='flex-1 flex justify-end max-sm:justify-start'>
            <ArrowLink to={REPO_URL} external>
              View source on GitHub
            </ArrowLink>
          </div>
        </div>
      </Container>
    </section>
  </main>
);

export default AboutPage;
