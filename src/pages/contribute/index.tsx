import { FC } from 'react';
import SEO from '../../components/SEO';
import { ContributeHero } from './ContributeHero';
import { ContributeRouter } from './ContributeRouter';

/**
 * /contribute — the index of every way into BetterGov.
 *
 * It sits beside /join-us rather than replacing it, because the two do
 * different jobs: /join-us turns a stranger into someone interested,
 * /contribute turns someone interested into a first contribution.
 *
 * Origin: issue #54, section 3.
 */
const Contribute: FC = () => (
  <div className='min-h-screen bg-gray-50'>
    {/* Title and description come from src/data/seo-metadata.json, keyed by
        pathname. Passing them here too would be a second copy free to drift. */}
    <SEO
      keywords={[
        'contribute',
        'volunteer',
        'open source',
        'civic tech',
        'bettergov',
        'philippines',
      ]}
      breadcrumbs={[
        { name: 'Home', url: '/' },
        { name: 'Contribute', url: '/contribute' },
      ]}
    />

    <ContributeHero />

    <section
      id='ways-to-help'
      aria-labelledby='ways-to-help-heading'
      className='py-12 md:py-16 scroll-mt-4'
    >
      <ContributeRouter />
    </section>
  </div>
);

export default Contribute;
