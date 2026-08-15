import { FC, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import PageMasthead from '../../components/v2/layout/PageMasthead';
import Container from '../../components/v2/ui/Container';
import SectionHeader from '../../components/v2/ui/SectionHeader';
import Button from '../../components/v2/ui/Button';
import Card from '../../components/v2/ui/Card';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import BigSearch from '../../components/v2/ui/BigSearch';
import ArrowLink from '../../components/v2/ui/ArrowLink';
import OfficialsTable from '../../components/v2/directory/OfficialsTable';
import { Example, Prose, WhenToUse } from './shared';

const ComponentsPage: FC = () => {
  const [searchDemo, setSearchDemo] = useState('');

  return (
    <>
      <Helmet>
        <title>Components — Design System | BetterGov.ph</title>
        <meta
          name='description'
          content='Ready-made, accessible UI components for Philippine government digital services: buttons, cards, tables, search, tags, and more.'
        />
        <link rel='canonical' href='https://bettergov.ph/design/components' />
      </Helmet>

      <PageMasthead
        eyebrow='Design System · Components'
        title='Components'
        lede='Reusable building blocks that are already accessible, already consistent, and already in production. Use them as-is; propose a change if they fall short.'
      />

      {/* ------------------------------------------------ Button */}
      <section className='py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader label='Button' meta='components/v2/ui/Button' />
          <Prose>
            <p>
              Buttons start actions: submitting a search, filing a report,
              confirming a step. The solid variant is for the single most
              important action on a screen; the ghost variant is for secondary
              actions beside it. If the element takes people to another page, it
              is a link, not a button — style it as one.
            </p>
          </Prose>
          <Example caption='variant: solid · ghost — size: md · sm'>
            <div className='flex flex-wrap items-center gap-4'>
              <Button>Start a report</Button>
              <Button variant='ghost'>Cancel</Button>
              <Button size='sm'>Apply filter</Button>
              <Button variant='ghost' size='sm'>
                Clear
              </Button>
            </div>
          </Example>
          <WhenToUse
            use={[
              'The primary action of a page or form — at most one solid button per view.',
              'Secondary actions that belong beside the primary one, as ghost buttons.',
            ]}
            avoid={[
              'Navigation between pages — use a link or arrow link instead.',
              'More than one solid button in the same region; it makes the priority ambiguous.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Eyebrow & Flag */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader
            label='Eyebrow & flag'
            meta='components/v2/ui/Eyebrow · Flag'
          />
          <Prose>
            <p>
              Eyebrows are small mono labels that sit above a title and name its
              section — they orient, never explain. Flags mark an item with a
              short status or category. Both are uppercase and letter-spaced;
              neither should ever hold a full sentence.
            </p>
          </Prose>
          <Example caption='Eyebrow tones · Flag variants'>
            <div className='space-y-6'>
              <div className='flex flex-wrap gap-6'>
                <Eyebrow>Section · Directory</Eyebrow>
                <Eyebrow tone='navy'>Guides · Passport</Eyebrow>
                <Eyebrow tone='red'>Advisory · Typhoon</Eyebrow>
              </div>
              <div className='flex flex-wrap gap-3'>
                <Flag>Department</Flag>
                <Flag variant='navy'>Executive</Flag>
                <Flag variant='red'>Emergency</Flag>
                <Flag variant='outline'>Draft</Flag>
              </div>
            </div>
          </Example>
          <WhenToUse
            use={[
              'Naming the section or category a page or card belongs to.',
              'Marking status that people scan for: branch of government, urgency, document type.',
            ]}
            avoid={[
              'Decorating — if the label repeats the heading below it, delete it.',
              'The red variants for anything that is not genuinely urgent.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Card */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader label='Card' meta='components/v2/ui/Card' />
          <Prose>
            <p>
              Cards are bordered, square-cornered link targets used in grids of
              navigation choices. The entire card is clickable, so it must
              contain exactly one destination — never nest links or buttons
              inside it.
            </p>
          </Prose>
          <Example caption='Card with eyebrow and description'>
            <div className='grid gap-5 md:grid-cols-2'>
              <Card to='/guides/passport'>
                <Eyebrow tone='navy'>Guides</Eyebrow>
                <h3 className='mt-3 font-serif-ed text-xl text-ed-ink'>
                  Getting a Philippine passport
                </h3>
                <p className='mt-2 font-serif-ed text-[15px] leading-relaxed text-ed-ink-2'>
                  Requirements, fees, and every step from appointment to
                  release.
                </p>
              </Card>
              <Card to='/philippines/hotlines'>
                <Eyebrow tone='red'>Emergency</Eyebrow>
                <h3 className='mt-3 font-serif-ed text-xl text-ed-ink'>
                  National hotlines
                </h3>
                <p className='mt-2 font-serif-ed text-[15px] leading-relaxed text-ed-ink-2'>
                  Verified numbers for police, fire, medical, and disaster
                  response.
                </p>
              </Card>
            </div>
          </Example>
          <WhenToUse
            use={[
              'A grid of navigation choices of roughly equal weight.',
              'Directory entries where people compare items before choosing one.',
            ]}
            avoid={[
              'Wrapping ordinary body content just to put a box around it.',
              'Anything that needs more than one link or action inside.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Page masthead */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader
            label='Page masthead'
            meta='components/v2/layout/PageMasthead'
          />
          <Prose>
            <p>
              Every page opens with a masthead: an optional eyebrow, one serif
              display title, and an optional lede. The light variant is the
              default for listing and detail pages; the hero variant — a navy
              gradient — is reserved for a section&rsquo;s front door and should
              appear at most once per journey.
            </p>
          </Prose>
          <Example caption='variant: light' padded={false}>
            <PageMasthead
              eyebrow='Section · Example'
              title='A clear, plain-language title'
              lede='One sentence that tells people they are in the right place and what they can do here.'
            />
          </Example>
          <Example caption='variant: hero' padded={false}>
            <PageMasthead
              variant='hero'
              eyebrow='The Directory · 480 entries tracked'
              title={
                <>
                  Every agency,{' '}
                  <em className='italic font-normal'>one directory.</em>
                </>
              }
            />
          </Example>
          <WhenToUse
            use={[
              'The top of every page — it is how pages declare their h1.',
              'The hero variant on section landing pages only.',
            ]}
            avoid={[
              'Mid-page — use a section header instead.',
              'Stacking two mastheads or using the hero variant on detail pages.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Section header */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader
            label='Section header'
            meta='components/v2/ui/SectionHeader'
          />
          <Prose>
            <p>
              Section headers divide a page into scannable bands: a navy top
              rule, a mono label, and an optional right-aligned meta note — a
              count, a source, a date. They replace decorative sub-headings on
              structured pages.
            </p>
          </Prose>
          <Example caption='label + meta'>
            <SectionHeader
              label='Most requested'
              meta='Updated weekly · Source: site analytics'
            />
            <p className='font-serif-ed text-[15px] text-ed-ink-3'>
              Section content follows here…
            </p>
          </Example>
        </Container>
      </section>

      {/* ------------------------------------------------ Big search */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader label='Big search' meta='components/v2/ui/BigSearch' />
          <Prose>
            <p>
              The oversized search field is the workhorse of directory and index
              pages. The serif italic placeholder shows an example query, not an
              instruction — write &ldquo;Try: passport renewal&rdquo;, not
              &ldquo;Enter your search term&rdquo;.
            </p>
          </Prose>
          <Example caption='default (light) variant'>
            <BigSearch
              value={searchDemo}
              onChange={setSearchDemo}
              onSubmit={() => {}}
              placeholder='Try: business permit, SSS, travel tax…'
              ariaLabel='Example search'
            />
          </Example>
          <WhenToUse
            use={[
              'Directory and index pages where searching is the main task.',
              'Section mastheads, using the onDark variant inside a hero.',
            ]}
            avoid={[
              'Filtering a short list the eye can scan — show the list instead.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Officials table */}
      <section className='border-t border-ed-rule py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader
            label='Officials table'
            meta='components/v2/directory/OfficialsTable'
          />
          <Prose>
            <p>
              Structured records — who holds an office, how to reach them — use
              the editorial two-column list: the role in mono on the left, the
              person and verified contact details in serif on the right. Rows
              are separated by hairline rules, never zebra stripes.
            </p>
          </Prose>
          <Example caption='role · name · verified contact'>
            <OfficialsTable
              groupLabel='Office of the Secretary'
              officials={[
                {
                  role: 'Secretary',
                  name: 'Juana Dela Cruz',
                  contact: '(02) 8123 4567',
                  email: 'osec@example.gov.ph',
                },
                {
                  role: 'Undersecretary',
                  office: 'Operations',
                  name: 'Jose Rizal Santos',
                  email: 'ops@example.gov.ph',
                },
              ]}
              className='mb-0'
            />
          </Example>
          <WhenToUse
            use={[
              'Officials, contact points, and other label-plus-value records.',
              'Any list where people look up one row rather than read every row.',
            ]}
            avoid={[
              'Numeric data that needs comparison across columns — use a true table.',
            ]}
          />
        </Container>
      </section>

      {/* ------------------------------------------------ Proposing */}
      <section className='border-t border-ed-rule bg-ed-paper-2 py-12 max-md:py-8'>
        <Container narrow>
          <SectionHeader label='Need something that is not here?' />
          <Prose>
            <p>
              If no component fits, first try composing existing styles — most
              needs are a heading, a rule, and restraint. If the need is real
              and recurring, propose a new component through the community
              process.
            </p>
            <ArrowLink to='/design/community'>
              How to propose a component
            </ArrowLink>
          </Prose>
        </Container>
      </section>
    </>
  );
};

export default ComponentsPage;
