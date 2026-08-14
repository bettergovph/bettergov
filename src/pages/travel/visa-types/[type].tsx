import { FC, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircleIcon, ExternalLinkIcon } from 'lucide-react';
import visaData from '../../../data/visa/philippines_visa_types.json';
import type { VisaType } from '@/types/visa.ts';
import Container from '../../../components/v2/ui/Container';
import SectionHeader from '../../../components/v2/ui/SectionHeader';
import Button from '../../../components/v2/ui/Button';
import DetailHeader from '../../../components/v2/directory/DetailHeader';

const VisaTypeDetail: FC = () => {
  const { type } = useParams<{ type: string }>();

  const { visa, category } = useMemo(() => {
    const all = visaData.categories.flatMap(c =>
      c.visaTypes.map(v => ({ visa: v, category: c }))
    );
    return all.find(x => x.visa.id === type) ?? { visa: null, category: null };
  }, [type]);

  if (!visa || !category) {
    return (
      <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
        <DetailHeader
          breadcrumbs={[
            { label: 'Travel', to: '/travel/visa' },
            { label: 'Visa types', to: '/travel/visa-types' },
            { label: 'Not found' },
          ]}
          title='Visa type not found.'
          lede={`We couldn't find a visa matching "${type ?? ''}". Browse the full list to find the right one.`}
        >
          <Button as={Link} to='/travel/visa-types'>
            <span>Back to visa types</span>
          </Button>
        </DetailHeader>
      </main>
    );
  }

  const v = visa as VisaType;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>{v.name} · Philippine Visa | BetterGov.ph</title>
        <meta name='description' content={v.description} />
      </Helmet>

      <DetailHeader
        breadcrumbs={[
          { label: 'Travel', to: '/travel/visa' },
          { label: 'Visa types', to: '/travel/visa-types' },
          { label: category.name, to: '/travel/visa-types' },
          { label: v.name },
        ]}
        eyebrow={`Visa · ${category.name}`}
        title={v.name}
        lede={v.description}
      >
        {v.url && (
          <Button as='a' href={v.url} target='_blank' rel='noreferrer'>
            <ExternalLinkIcon size={14} />
            <span>Official information</span>
          </Button>
        )}
      </DetailHeader>

      <section className='py-12 max-md:py-8'>
        <Container>
          {v.minimumRequirements && v.minimumRequirements.length > 0 && (
            <>
              <SectionHeader
                label='Minimum requirements'
                meta={`${v.minimumRequirements.length} items`}
              />
              <ul className='mb-10 ml-0 list-none border-y border-ed-rule'>
                {v.minimumRequirements.map((req, i) => (
                  <li
                    key={i}
                    className='grid grid-cols-[40px_1fr] gap-4 border-b border-ed-rule py-4 last:border-b-0'
                  >
                    <span className='pt-1 font-mono-ed text-[11px] tracking-[0.14em] text-ed-ink-4'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className='font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {v.subtypes && v.subtypes.length > 0 && (
            <>
              <SectionHeader
                label='Subtypes'
                meta={`${v.subtypes.length} variants`}
              />
              <div className='mb-10 grid grid-cols-2 gap-6 max-md:grid-cols-1'>
                {v.subtypes.map((s, i) => (
                  <article
                    key={i}
                    className='border border-ed-rule bg-white p-6'
                  >
                    <h3 className='m-0 font-serif-ed text-[22px] font-medium leading-tight text-ed-navy-ink'>
                      {s.name}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-ed-ink-2'>
                      {s.description}
                    </p>

                    {Array.isArray(s.requirements) ? (
                      <RequirementsList
                        label='Requirements'
                        items={s.requirements}
                      />
                    ) : (
                      <>
                        {s.requirements.businessOwners && (
                          <RequirementsList
                            label='Business owners'
                            items={s.requirements.businessOwners}
                          />
                        )}
                        {s.requirements.employees && (
                          <RequirementsList
                            label='Employees'
                            items={s.requirements.employees}
                          />
                        )}
                      </>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Source notice */}
          <aside className='mt-4 border border-ed-rule-strong bg-ed-paper-2 p-7'>
            <div className='flex items-start gap-3'>
              <AlertCircleIcon
                size={18}
                className='mt-0.5 shrink-0 text-ed-navy'
                aria-hidden
              />
              <div>
                <div className='font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-navy'>
                  Source note
                </div>
                <p className='mt-1.5 text-sm leading-relaxed text-ed-ink-2'>
                  This information is provided for reference only. For the most
                  accurate and up-to-date visa requirements, consult the
                  official{' '}
                  <a
                    href='https://immigration.gov.ph/visas/'
                    target='_blank'
                    rel='noreferrer'
                    className='border-b border-ed-navy pb-0.5 text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
                  >
                    Philippine Bureau of Immigration
                  </a>{' '}
                  or{' '}
                  <a
                    href='https://dfa.gov.ph/'
                    target='_blank'
                    rel='noreferrer'
                    className='border-b border-ed-navy pb-0.5 text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
                  >
                    Department of Foreign Affairs
                  </a>
                  .
                </p>
                <p className='mt-2 font-mono-ed text-[10px] uppercase tracking-[0.12em] text-ed-ink-3'>
                  Last updated · {visaData.sourceInfo.lastUpdated}
                </p>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </main>
  );
};

const RequirementsList: FC<{ label: string; items: string[] }> = ({
  label,
  items,
}) => (
  <div className='mt-4'>
    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3'>
      {label}
    </div>
    <ul className='mt-1.5 list-disc space-y-1 pl-5 text-sm text-ed-ink-2'>
      {items.map((r, i) => (
        <li key={i}>{r}</li>
      ))}
    </ul>
  </div>
);

export default VisaTypeDetail;
