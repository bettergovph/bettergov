import { ExternalLinkIcon, LinkIcon } from 'lucide-react';
import type { ConstitutionFullText } from '../schema';

/**
 * Utility to convert Roman numerals or text to standard numbers/slugs
 * e.g., "Article III" + "1" -> "article3section1"
 */
function parseRoman(roman: string): number | string {
  const map: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
  };
  const str = roman.toUpperCase().trim();
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    const current = map[str[i]];
    const next = map[str[i + 1]];
    if (current) {
      if (next && current < next) {
        num += next - current;
        i++;
      } else {
        num += current;
      }
    } else {
      return roman.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  return num || roman;
}

function getArticleSlug(heading: string): string {
  const match = heading.match(/(?:Article|Title)\s+([IVXLCDM\d]+)/i);
  if (match) {
    const rawVal = match[1];
    const parsed = /^\d+$/.test(rawVal) ? rawVal : parseRoman(rawVal);
    return `article${parsed}`;
  }
  return heading.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getSectionSlug(
  articleHeading: string,
  sectionNumber?: string
): string {
  const articleSlug = getArticleSlug(articleHeading);
  if (!sectionNumber) return articleSlug;

  const cleanSec = sectionNumber
    .replace(/^(WHEREAS|WHEREFORE)_?/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

  return `${articleSlug}section${cleanSec}`;
}

export default function FullTextReader({
  fullText,
}: {
  fullText: ConstitutionFullText;
}) {
  return (
    <div className='border-t border-gray-200 pt-8 mt-8'>
      <div className='flex items-center justify-between flex-wrap gap-2 mb-6'>
        <h2 className='text-xl font-bold text-gray-900'>Read the Full Text</h2>
        <a
          href={fullText.sourceUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center text-xs text-gray-800 hover:text-primary-600 hover:underline'
        >
          Verbatim text transcribed from source
          <ExternalLinkIcon className='h-3 w-3 ml-1' />
        </a>
      </div>

      <article className='prose prose-sm max-w-none prose-headings:font-semibold'>
        {fullText.preamble && (
          <section id='preamble' className='mb-8 scroll-mt-32'>
            <h3 className='group flex items-center text-base font-semibold text-gray-900 mb-2'>
              <a
                href='#preamble'
                className='hover:underline flex items-center gap-1.5'
              >
                Preamble
                <LinkIcon className='h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400' />
              </a>
            </h3>
            <p className='text-gray-800 leading-relaxed whitespace-pre-line'>
              {fullText.preamble}
            </p>
          </section>
        )}

        {fullText.articles.map((article, i) => {
          const articleId = getArticleSlug(article.heading);

          return (
            <section key={i} className='mb-8 scroll-mt-32' id={articleId}>
              <h3 className='group flex items-center text-base font-semibold text-gray-900 mb-1'>
                <a
                  href={`#${articleId}`}
                  className='hover:underline flex items-center gap-1.5'
                >
                  {article.heading}
                  <LinkIcon className='h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400' />
                </a>
              </h3>
              {article.title ? (
                <span className='block text-sm font-medium text-gray-800 mb-3'>
                  {article.title}
                </span>
              ) : null}

              <div className='space-y-4 mt-3'>
                {article.sections.map((section, j) => {
                  const sectionId = getSectionSlug(
                    article.heading,
                    section.number
                  );

                  return (
                    <div
                      key={j}
                      id={sectionId}
                      className='group relative p-2 -mx-2 rounded-md hover:bg-gray-50/80 transition-colors scroll-mt-32'
                    >
                      <p className='text-gray-800 leading-relaxed whitespace-pre-line'>
                        {section.number && (
                          <span className='font-medium text-gray-900 mr-1'>
                            {section.number.startsWith('WHEREAS') ||
                            section.number === 'WHEREFORE'
                              ? `${section.number.split('_')[0]} `
                              : section.number.startsWith('Article')
                                ? `${section.number}. `
                                : `Section ${section.number}. `}
                          </span>
                        )}
                        {section.text}
                      </p>
                      {section.number && (
                        <a
                          href={`#${sectionId}`}
                          aria-label={`Direct link to ${sectionId}`}
                          className='absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary-600 p-1'
                        >
                          <LinkIcon className='h-3.5 w-3.5' />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </article>

      <p className='text-xs text-gray-800 mt-6 pt-4 border-t border-gray-100'>
        Transcribed from{' '}
        <a
          href={fullText.sourceUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='underline hover:text-primary-600'
        >
          {fullText.sourceUrl}
        </a>{' '}
        (last verified {fullText.retrievedDate}). Philippine government works
        such as constitutions are not subject to copyright under Republic Act
        8293, Sec. 176. If you spot a discrepancy against the source, please
        report it.
      </p>
    </div>
  );
}
