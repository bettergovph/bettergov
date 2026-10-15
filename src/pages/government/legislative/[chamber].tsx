import { FC } from 'react';
import { useParams } from 'react-router-dom';
import legislativeData from '../../../data/directory/legislative.json';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import ArrowLink from '../../../components/v2/ui/ArrowLink';
import DetailHeader from '../../../components/v2/directory/DetailHeader';
import OfficialsTable, {
  type OfficialRow,
} from '../../../components/v2/directory/OfficialsTable';
import { titleCase } from '../../../lib/directory';

type Leader = { name: string; contact?: { contact?: string } };

type HouseLeaders = {
  speaker?: Leader;
  senior_deputy_speaker?: Leader;
  deputy_speakers?: Leader[];
  majority_floor_leader?: Leader;
  senior_deputy_majority_floor_leader?: Leader;
  minority_floor_leader?: Leader;
  senior_deputy_minority_floor_leader?: Leader;
};

/** House leadership as officer rows, in order of precedence. */
function houseOfficers(l?: HouseLeaders): OfficialRow[] {
  if (!l) return [];
  const row = (role: string, x?: Leader): OfficialRow[] =>
    x ? [{ role, name: x.name, contact: x.contact?.contact }] : [];
  return [
    ...row('Speaker', l.speaker),
    ...row('Senior Deputy Speaker', l.senior_deputy_speaker),
    ...(l.deputy_speakers ?? []).flatMap(x => row('Deputy Speaker', x)),
    ...row('Majority Floor Leader', l.majority_floor_leader),
    ...row(
      'Senior Deputy Majority Floor Leader',
      l.senior_deputy_majority_floor_leader
    ),
    ...row('Minority Floor Leader', l.minority_floor_leader),
    ...row(
      'Senior Deputy Minority Floor Leader',
      l.senior_deputy_minority_floor_leader
    ),
  ];
}

type Chamber = {
  slug: string;
  chamber: string;
  branch?: string;
  address?: string;
  trunkline?: string;
  website?: string;
  officials?: OfficialRow[];
  house_leaders?: HouseLeaders;
};

const LegislativeChamber: FC = () => {
  const { chamber: slug } = useParams<{ chamber: string }>();
  const chamber = (legislativeData as Chamber[]).find(c => c.slug === slug);

  if (!chamber) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Directory', to: '/government' },
            { label: 'Legislative', to: '/government/legislative' },
            { label: 'Not found' },
          ]}
          title='Chamber not found.'
          lede='Please pick a chamber from the directory.'
        />
      </main>
    );
  }

  const name = titleCase(chamber.chamber);
  const isSenate = chamber.slug.includes('senate');
  const officers = chamber.officials ?? houseOfficers(chamber.house_leaders);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <DetailHeader
        breadcrumbs={[
          { label: 'Directory', to: '/government' },
          { label: 'Legislative', to: '/government/legislative' },
          { label: name },
        ]}
        title={name}
        address={chamber.address}
        trunkline={chamber.trunkline}
        website={chamber.website}
      />

      <section className='py-12 max-md:py-6'>
        <Container>
          {officers.length > 0 && (
            <>
              <SectionHeader
                label='Officers'
                meta={`${officers.length} officials`}
              />
              <OfficialsTable officials={officers} />
            </>
          )}

          <div className='mt-10 grid grid-cols-2 gap-6 max-md:grid-cols-1'>
            {isSenate ? (
              <>
                <RelatedCard
                  eyebrow='Members'
                  title='24 senators, elected at-large'
                  desc='The full Senate roster, party affiliations, and committee assignments for the 20th Congress.'
                  to='/government/legislative/senate-committees'
                  cta='View Senate committees'
                />
                <RelatedCard
                  eyebrow='Other chamber'
                  title='House of Representatives'
                  desc='Party-list and district members of the lower house.'
                  to='/government/legislative/house-of-representatives-20th-congress'
                  cta='See the House'
                />
              </>
            ) : (
              <>
                <RelatedCard
                  eyebrow='District members'
                  title='District representatives'
                  desc='One member per congressional district — 254 seats apportioned by population.'
                  to='/government/legislative/house-members'
                  cta='Browse district members'
                />
                <RelatedCard
                  eyebrow='Party-list'
                  title='Party-list members'
                  desc='Marginalized and underrepresented sectors — up to 20% of House seats.'
                  to='/government/legislative/party-list-members'
                  cta='Browse party-list'
                />
              </>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
};

const RelatedCard: FC<{
  eyebrow: string;
  title: string;
  desc: string;
  to: string;
  cta: string;
}> = ({ eyebrow, title, desc, to, cta }) => (
  <div className='border border-ed-rule bg-white p-7 transition-colors hover:border-ed-ink'>
    <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
      {eyebrow}
    </div>
    <h3 className='mt-2 font-serif-ed text-[22px] font-semibold text-ed-navy-ink max-md:text-[18px]'>
      {title}
    </h3>
    <p className='mt-2.5 text-sm leading-normal text-ed-ink-2'>{desc}</p>
    <div className='mt-4'>
      <ArrowLink to={to}>{cta}</ArrowLink>
    </div>
  </div>
);

export default LegislativeChamber;
