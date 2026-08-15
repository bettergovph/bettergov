import { FC, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import Container from '../../components/v2/ui/Container';
import { cn } from '../../lib/utils';
import { DESIGN_SECTIONS, SectionDef } from './sections';

const isSectionActive = (section: SectionDef, pathname: string) =>
  section.end ? pathname === section.to : pathname.startsWith(section.to);

/**
 * Tracks which subsection anchor is currently in view so the sidebar can
 * highlight it. Observes the DocSection ids of the active section only.
 */
const useScrollSpy = (ids: string[]) => {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(null);
    if (ids.length === 0) return;
    const els = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      // A band near the top of the viewport decides the "current" section.
      { rootMargin: '-10% 0px -75% 0px' }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return current;
};

const DesignSystemLayout: FC = () => {
  const { pathname } = useLocation();
  const activeSection = DESIGN_SECTIONS.find(s => isSectionActive(s, pathname));
  const spyAnchor = useScrollSpy(
    activeSection ? activeSection.subsections.map(s => s.id) : []
  );
  // Before any scrolling has happened, treat the first subsection as current.
  const currentAnchor = spyAnchor ?? activeSection?.subsections[0]?.id;

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Container className='max-w-[1200px] py-10 max-md:py-6'>
        <div className='grid gap-12 lg:grid-cols-[230px_minmax(0,1fr)]'>
          <aside>
            <nav
              aria-label='Design system sections'
              className='lg:sticky lg:top-6'
            >
              <div className='border-b-2 border-ed-ink pb-3'>
                <div className='font-serif-ed text-[17px] font-bold leading-tight text-ed-ink'>
                  Design System
                </div>
                <div className='mt-0.5 font-sans-ed text-[11px] uppercase tracking-[0.1em] text-ed-ink-3'>
                  National guidelines · Draft
                </div>
              </div>

              <ul className='mt-3 max-lg:flex max-lg:flex-wrap max-lg:gap-x-5 max-lg:gap-y-1'>
                {DESIGN_SECTIONS.map(section => {
                  const active = isSectionActive(section, pathname);
                  return (
                    <li key={section.to}>
                      <NavLink
                        to={section.to}
                        end={section.end}
                        className={cn(
                          'block py-2 font-sans-ed text-sm no-underline transition-colors',
                          active
                            ? 'font-semibold text-ed-ink'
                            : 'text-ed-ink-2 hover:text-ed-navy'
                        )}
                      >
                        {section.label}
                      </NavLink>
                      {active && section.subsections.length > 0 && (
                        <ul className='mb-2 border-l border-ed-rule max-lg:hidden'>
                          {section.subsections.map(sub => (
                            <li key={sub.id}>
                              <a
                                href={`#${sub.id}`}
                                aria-current={
                                  currentAnchor === sub.id
                                    ? 'location'
                                    : undefined
                                }
                                className={cn(
                                  '-ml-px block border-l-2 py-1.5 pl-4 font-sans-ed text-[13px] leading-snug no-underline transition-colors',
                                  currentAnchor === sub.id
                                    ? 'border-ed-navy font-medium text-ed-navy'
                                    : 'border-transparent text-ed-ink-2 hover:border-ed-rule-strong hover:text-ed-navy'
                                )}
                              >
                                {sub.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className='mt-6 border-t border-ed-rule pt-4 max-lg:hidden'>
                <a
                  href='https://github.com/bettergovph/bettergov/issues'
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 font-sans-ed text-[13px] text-ed-ink-2 no-underline transition-colors hover:text-ed-navy'
                >
                  Propose a change <ArrowUpRightIcon size={13} />
                </a>
              </div>
            </nav>
          </aside>

          <div className='min-w-0'>
            <Outlet />
          </div>
        </div>
      </Container>
    </main>
  );
};

export default DesignSystemLayout;
