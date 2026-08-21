import { FC } from 'react';
import SEO from '../../components/SEO';
import { ContributeHero } from './ContributeHero';
import { ContributeRouter } from './ContributeRouter';

// Sits beside /join-us rather than replacing it: /join-us introduces the
// project, /contribute routes someone already interested to a first task.
const Contribute: FC = () => (
  <div className='min-h-screen bg-gray-50'>
    {/* Title and description come from src/data/seo-metadata.json */}
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
