import { FC } from 'react';
import { GithubIcon } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Container from '../components/v2/ui/Container';
import Eyebrow from '../components/v2/ui/Eyebrow';
import Flag from '../components/v2/ui/Flag';
import Button from '../components/v2/ui/Button';
import PageMasthead from '../components/v2/layout/PageMasthead';

type Difficulty = 'simple' | 'moderate' | 'complex';

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: Difficulty;
  author: string;
}

const IDEAS: Idea[] = [
  {
    id: '1',
    title: 'Blockchain-powered community government project reporting app',
    description:
      'A transparent, immutable platform where citizens can report and track government projects in their communities. Uses blockchain technology to ensure data integrity and prevent tampering with project reports and progress updates.',
    tags: ['Transparency', 'Accountability'],
    difficulty: 'complex',
    author: 'Community',
  },
  {
    id: '2',
    title: 'Glassdoor for government agencies',
    description:
      'An anonymous review platform where government employees and citizens can rate and review government agencies, departments, and services. Provides insights into workplace culture, service quality, and areas for improvement.',
    tags: ['Public Feedback', 'Open Data'],
    difficulty: 'moderate',
    author: 'Community',
  },
  {
    id: '3',
    title: 'Design guidelines for BetterGov.ph',
    description:
      'Comprehensive design system and guidelines for the BetterGov.ph platform. Includes UI components, color schemes, typography, accessibility standards, and best practices for government web services.',
    tags: ['Platform', 'Design'],
    difficulty: 'simple',
    author: 'Editorial Team',
  },
  {
    id: '4',
    title: 'Rate the politicians',
    description:
      'A citizen-driven platform to rate and review elected officials based on their performance, campaign promises, voting records, and public service delivery. Includes fact-checking and transparency features.',
    tags: ['Political Accountability', 'Elections'],
    difficulty: 'moderate',
    author: 'Community',
  },
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  simple: 'Simple',
  moderate: 'Moderate',
  complex: 'Complex',
};

const DIFFICULTY_VARIANT: Record<Difficulty, 'outline' | 'default' | 'red'> = {
  simple: 'outline',
  moderate: 'default',
  complex: 'red',
};

const GITHUB_SUBMIT_URL =
  'https://github.com/bettergovph/bettergov/issues/new?assignees=&labels=enhancement%2Cidea&projects=&template=idea-submission.md&title=%5BIDEA%5D+';

const Ideas: FC = () => {
  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Project Ideas | BetterGov.ph</title>
        <meta
          name='description'
          content='Explore innovative civic tech project ideas to improve government transparency, accountability, and citizen engagement in the Philippines.'
        />
        <link rel='canonical' href='https://bettergov.ph/ideas' />
        <meta property='og:title' content='Project Ideas | BetterGov.ph' />
        <meta
          property='og:description'
          content='Explore innovative project ideas to improve government transparency, accountability, and citizen engagement in the Philippines.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bettergov.ph/ideas' />
      </Helmet>

      <PageMasthead
        variant='hero'
        eyebrow='§ Ideas'
        title='Project ideas'
        lede='Open civic tech concepts to improve transparency, accountability, and citizen engagement. Pick one up, build it, and ship it.'
      />

      {/* Ideas list */}
      <section className='py-10 max-md:py-6'>
        <Container>
          <div className='mb-6 flex items-center justify-between border-b border-ed-ink pb-3.5'>
            <div className='font-mono-ed text-xs uppercase tracking-[0.1em] text-ed-ink-2'>
              <strong className='text-sm text-ed-ink'>{IDEAS.length}</strong>{' '}
              idea{IDEAS.length === 1 ? '' : 's'}
            </div>
          </div>

          <ul className='divide-y divide-ed-rule'>
            {IDEAS.map((idea, i) => (
              <li
                key={idea.id}
                className='grid grid-cols-[60px_1fr] gap-6 py-8 max-md:grid-cols-1 max-md:gap-3 max-md:py-6'
              >
                <div className='pt-1 font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-4 max-md:pt-0'>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Flag variant={DIFFICULTY_VARIANT[idea.difficulty]}>
                      {DIFFICULTY_LABEL[idea.difficulty]}
                    </Flag>
                    {idea.tags.map(tag => (
                      <Eyebrow key={tag}>{tag}</Eyebrow>
                    ))}
                  </div>
                  <h2 className='mt-3 font-serif-ed text-[22px] font-medium leading-tight tracking-[-0.005em] text-ed-ink'>
                    {idea.title}
                  </h2>
                  <p className='mt-2 max-w-[680px] text-sm leading-relaxed text-ed-ink-2'>
                    {idea.description}
                  </p>
                  <div className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-4'>
                    Suggested by{' '}
                    <span className='text-ed-ink-3'>{idea.author}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className='mt-10 border-t border-ed-rule pt-6 font-serif-ed text-sm text-ed-ink-3'>
            These ideas are collected from the community and the editorial team.
            See something missing or have a refinement? Submit your own via
            GitHub.
          </p>
        </Container>
      </section>

      {/* Submit-idea CTA band */}
      <section className='border-t border-ed-ink bg-ed-navy py-14 max-md:py-10'>
        <Container>
          <div className='flex items-center justify-between gap-8 max-md:flex-col max-md:items-start'>
            <div>
              <Eyebrow tone='onDark' className='mb-3'>
                Get involved
              </Eyebrow>
              <h2 className='font-serif-ed text-[clamp(24px,3vw,36px)] font-normal leading-tight tracking-[-0.01em] text-white'>
                Have an idea? <em className='font-normal italic'>Submit it.</em>
              </h2>
              <p className='mt-2 max-w-md font-serif-ed text-base leading-relaxed text-white/80'>
                Open a GitHub issue using our idea template — no login beyond
                GitHub required. The best ideas get picked up and built.
              </p>
            </div>
            <div className='flex shrink-0 flex-col gap-3 max-md:flex-row'>
              <Button
                as='a'
                href={GITHUB_SUBMIT_URL}
                target='_blank'
                rel='noreferrer'
                variant='solid'
                className='border-white bg-white text-ed-navy hover:bg-white/90 hover:border-white/90'
              >
                <GithubIcon size={16} />
                Submit via GitHub
              </Button>
              <Button
                as='a'
                href='/guides'
                variant='ghost'
                className='border-white text-white hover:bg-white hover:text-ed-navy'
              >
                Browse guides
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default Ideas;
