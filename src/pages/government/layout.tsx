import { FC } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Container from '../../components/v2/ui/Container';
import { cn } from '../../lib/utils';

type TabDef = { to: string; label: string; end?: boolean };

// /government/salary-grade is still routed; it's just not a tab.
const TABS: TabDef[] = [
  { to: '/government/overview', label: 'Overview' },
  { to: '/government/executive', label: 'Executive' },
  { to: '/government/departments', label: 'Departments' },
  { to: '/government/legislative', label: 'Legislative' },
  { to: '/government/judicial', label: 'Judicial' },
  { to: '/government/constitutional', label: 'Constitutional' },
  { to: '/government/local', label: 'Local Government' },
  { to: '/government/diplomatic', label: 'Diplomatic' },
  { to: '/government', label: 'Directory', end: true },
];

const GovernmentLayout: FC = () => (
  <div className='bg-white font-sans-ed text-ed-ink antialiased'>
    <nav
      className='border-b border-ed-rule bg-white'
      aria-label='Government sections'
    >
      <Container className='flex flex-wrap max-md:flex-nowrap max-md:overflow-x-auto max-md:px-0'>
        {TABS.map((t, i) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'border-r border-ed-rule px-[18px] py-3.5 font-sans-ed text-[11px] uppercase tracking-[0.12em] no-underline transition-colors max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3.5 max-md:py-2.5 max-md:text-[10px]',
                isActive
                  ? 'bg-ed-navy text-white'
                  : 'bg-transparent text-ed-ink-2 hover:bg-ed-navy-tint hover:text-ed-navy-ink',
                i === TABS.length - 1 && 'border-r-0'
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </Container>
    </nav>
    <Outlet />
  </div>
);

export default GovernmentLayout;
