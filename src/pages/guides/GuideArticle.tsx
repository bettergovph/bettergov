import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from 'lucide-react';
import SEO from '../../components/SEO';
import Container from '../../components/v2/ui/Container';
import Eyebrow from '../../components/v2/ui/Eyebrow';
import Flag from '../../components/v2/ui/Flag';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { findGuide, formatGuideDate, GUIDES, guideHref } from './data';
import { getGuideContent, splitGuideContent } from './content';
import GuideMarkdown from './GuideMarkdown';

export default function GuideArticle() {
  const { guideId = '' } = useParams<{ guideId: string }>();
  const guide = findGuide(guideId);
  const markdown = guide && getGuideContent(guide.id);
  useDocumentTitle(guide?.title ?? 'Guide not found');

  if (!guide || !markdown) {
    return (
      <main className='grow bg-white py-20 font-sans-ed text-ed-ink'>
        <SEO title='Guide not found' noIndex />
        <Container narrow>
          <h1 className='font-serif-ed text-4xl'>Guide not found</h1>
          <p className='my-5'>
            This guide is not available. Browse the collection to find your
            transaction.
          </p>
          <Link to='/guides' className='text-ed-navy underline'>
            Browse all guides
          </Link>
        </Container>
      </main>
    );
  }

  const { intro, sections } = splitGuideContent(markdown);
  const related = GUIDES.filter(
    g => g.id !== guide.id && g.cat === guide.cat
  ).slice(0, 3);
  const sectionLinks = [
    { id: 'at-a-glance', title: 'At a glance' },
    ...sections,
  ].map(section => (
    <li key={section.id}>
      <a
        href={`#${section.id}`}
        className='flex min-h-11 items-center py-2 text-ed-ink-2 hover:text-ed-navy hover:underline lg:min-h-0 lg:py-0'
      >
        {section.title}
      </a>
    </li>
  ));

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <SEO
        title={guide.title}
        description={guide.lede}
        canonical={guideHref(guide)}
        ogType='article'
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Guides', url: '/guides' },
          { name: guide.title, url: guideHref(guide) },
        ]}
      />
      <div className='border-b border-ed-rule'>
        <Container className='py-5 max-md:py-3.5'>
          <Link
            to='/guides'
            className='inline-flex items-center gap-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy hover:underline'
          >
            <ArrowLeftIcon size={14} aria-hidden='true' /> All guides
          </Link>
        </Container>
      </div>
      <article>
        <header className='border-b border-ed-rule bg-ed-paper-2 py-12 max-md:py-6'>
          <Container>
            <div className='max-w-[850px]'>
              <div className='mb-5 flex flex-wrap items-center gap-3 max-md:mb-3'>
                <Flag variant='navy'>{guide.agency}</Flag>
                <Eyebrow>{guide.cat}</Eyebrow>
              </div>
              <h1 className='font-serif-ed text-[clamp(32px,5vw,64px)] font-semibold leading-[1.08] tracking-[-0.025em] max-md:text-[28px] max-md:leading-tight'>
                {guide.title}
              </h1>
              <p className='mt-6 max-w-[720px] text-xl leading-relaxed text-ed-ink-2 max-md:mt-3 max-md:text-[15px]'>
                {guide.lede}
              </p>
              <div className='mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-md:mt-4 max-md:gap-x-4 max-md:text-[10px] max-md:tracking-[0.08em]'>
                <span>
                  Last reviewed{' '}
                  <time dateTime={guide.reviewedAt}>
                    {formatGuideDate(guide.reviewedAt)}
                  </time>
                </span>
                <span>{guide.time}</span>
                <span>
                  {guide.steps} steps
                  <span className='max-md:hidden'>
                    {' '}
                    across the application routes
                  </span>
                </span>
              </div>
            </div>
          </Container>
        </header>

        <Container className='grid grid-cols-[240px_minmax(0,1fr)] items-start gap-14 py-12 max-lg:grid-cols-1 max-lg:gap-8 max-md:gap-6 max-md:py-5'>
          <aside className='lg:sticky lg:top-8 print:hidden'>
            <nav
              aria-label='On this page'
              className='hidden border-t-2 border-ed-navy pt-4 lg:block'
            >
              <Eyebrow tone='navy'>On this page</Eyebrow>
              <ul className='mt-4 space-y-3 text-sm'>{sectionLinks}</ul>
            </nav>
            <details className='group border-y border-ed-rule lg:hidden'>
              <summary className='flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium text-ed-navy [&::-webkit-details-marker]:hidden'>
                On this page
                <ChevronDownIcon
                  size={16}
                  aria-hidden='true'
                  className='group-open:rotate-180'
                />
              </summary>
              <nav aria-label='Guide sections' className='pb-3'>
                <ul className='text-sm'>{sectionLinks}</ul>
              </nav>
            </details>
          </aside>

          <div className='min-w-0 max-w-[820px]'>
            <section
              id='at-a-glance'
              aria-labelledby='at-a-glance-heading'
              className='scroll-mt-8'
            >
              <h2
                id='at-a-glance-heading'
                className='mb-6 font-serif-ed text-3xl font-semibold text-ed-navy-ink max-md:mb-4 max-md:text-[22px]'
              >
                At a glance
              </h2>
              <GuideMarkdown>{intro}</GuideMarkdown>
            </section>
            {sections.map(section => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className='mt-12 scroll-mt-8 border-t border-ed-rule pt-8 max-md:mt-8 max-md:pt-5'
              >
                <h2
                  id={`${section.id}-heading`}
                  className='mb-6 font-serif-ed text-[28px] font-semibold leading-tight text-ed-navy-ink max-md:mb-4 max-md:text-[22px]'
                >
                  {section.title}
                </h2>
                <GuideMarkdown
                  className={
                    section.id === 'references' ? 'guide-references' : undefined
                  }
                >
                  {section.body}
                </GuideMarkdown>
              </section>
            ))}
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section
          aria-labelledby='related-guides'
          className='border-t border-ed-rule bg-ed-paper-2 py-12 max-md:py-7'
        >
          <Container>
            <h2
              id='related-guides'
              className='mb-7 font-serif-ed text-3xl font-semibold text-ed-navy-ink max-md:mb-4 max-md:text-[22px]'
            >
              Related guides
            </h2>
            <div className='grid grid-cols-3 gap-6 max-md:grid-cols-1 max-md:gap-3'>
              {related.map(item => (
                <Link
                  key={item.id}
                  to={guideHref(item)}
                  className='border border-ed-rule bg-white p-6 text-ed-ink hover:border-ed-navy max-md:p-4'
                >
                  <Eyebrow tone='navy'>{item.agency}</Eyebrow>
                  <h3 className='my-3 font-serif-ed text-xl font-semibold max-md:my-2 max-md:text-lg'>
                    {item.title}
                  </h3>
                  <span className='inline-flex items-center gap-2 text-sm text-ed-navy'>
                    Read guide <ArrowRightIcon size={14} aria-hidden='true' />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </main>
  );
}
