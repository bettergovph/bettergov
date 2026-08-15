import { FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Container from '../../components/v2/ui/Container';
import { cn } from '../../lib/utils';

type ItemDef = { to: string; label: string; end?: boolean };

const ITEMS: ItemDef[] = [
  { to: '/design', label: 'Overview', end: true },
  { to: '/design/styles', label: 'Styles' },
  { to: '/design/components', label: 'Components' },
  { to: '/design/patterns', label: 'Patterns' },
  { to: '/design/accessibility', label: 'Accessibility' },
  { to: '/design/community', label: 'Community' },
];

const DesignSystemLayout: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Container className='max-w-[1200px] py-10 max-md:py-6'>
      <div className='grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]'>
        <aside>
          <nav
            aria-label='Design system sections'
            className='lg:sticky lg:top-6'
          >
            <div className='mb-3 border-b border-ed-ink pb-2 font-sans-ed text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-ink'>
              Design System
            </div>
            <ul className='max-lg:flex max-lg:flex-wrap max-lg:gap-x-5 max-lg:gap-y-1'>
              {ITEMS.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'block border-l-2 py-2 pl-3 font-sans-ed text-sm no-underline transition-colors max-lg:border-l-0 max-lg:pl-0',
                        isActive
                          ? 'border-ed-navy font-semibold text-ed-navy'
                          : 'border-transparent text-ed-ink-2 hover:border-ed-rule-strong hover:text-ed-navy'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className='min-w-0'>
          <Outlet />
        </div>
      </div>
    </Container>
  </main>
);

export default DesignSystemLayout;
