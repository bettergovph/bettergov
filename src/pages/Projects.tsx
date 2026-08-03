import { useState, useEffect, useMemo } from 'react';
import type { Project, Tab } from '../types/index';
import { ProjectCard } from '../components/ui/ProjectCard';
import { LoadingGrid } from '../components/ui/LoadingGrid';

const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'development', label: 'Development' },
  { key: 'archived', label: 'Archived' },
];

const REPO_TYPE_OPTIONS = [
  { value: '', label: 'All Repos' },
  { value: 'orgprojects', label: 'Org Projects' },
  { value: 'community', label: 'Community' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'law', label: 'Law' },
  { value: 'money', label: 'Money' },
  { value: 'data', label: 'Data' },
  { value: 'election', label: 'Election' },
  { value: 'health', label: 'Health' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'other', label: 'Other' },
];

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [repoType, setRepoType] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetch('/api/projects.json')
      .then(res => {
        if (!res.ok)
          throw new Error(`Failed to load projects.json (${res.status})`);
        return res.json();
      })
      .then((data: Project[]) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const counts = useMemo(
    () => ({
      active: projects.filter(p => p.status === 'active').length,
      development: projects.filter(p => p.status === 'development').length,
      archived: projects.filter(p => p.status === 'archived').length,
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (p.status !== tab) return false;
      if (repoType && p.repoType !== repoType) return false;
      if (category && p.category !== category) return false;
      const q = search.toLowerCase();
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [projects, tab, search, repoType, category]);

  return (
    <div className='bg-gray-50 min-h-screen font-sans'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Our Projects</h1>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className='flex border-b border-gray-200 mb-5'>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors cursor-pointer bg-transparent',
                  active
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {t.label}
                <span
                  className={[
                    'text-[11px] px-1.5 py-px rounded-full font-medium',
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filters row ──────────────────────────────────────────────────── */}
        <div className='flex flex-wrap gap-3 mb-6'>
          {/* Search */}
          <div className='relative flex-1 min-w-45 max-w-sm'>
            <svg
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <path d='m21 21-4.35-4.35' />
            </svg>
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search projects...'
              className='w-full bg-white border border-gray-200 rounded-lg text-gray-800 text-sm py-2 pl-9 pr-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-400 shadow-sm'
            />
          </div>

          {/* Repo type filter */}
          <select
            value={repoType}
            onChange={e => setRepoType(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg text-sm text-gray-700 py-2 px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm cursor-pointer'
          >
            {REPO_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className='bg-white border border-gray-200 rounded-lg text-sm text-gray-700 py-2 px-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm cursor-pointer'
          >
            {CATEGORY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Clear filters — only show when something is active */}
          {(repoType || category || search) && (
            <button
              onClick={() => {
                setRepoType('');
                setCategory('');
                setSearch('');
              }}
              className='text-sm text-gray-400 hover:text-gray-600 transition-colors px-2'
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* ── States ───────────────────────────────────────────────────────── */}
        {loading && <LoadingGrid />}

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm'>
            <strong className='block mb-1.5'>
              Could not load projects.json
            </strong>
            <p className='text-gray-500 mb-1'>{error}</p>
            <p className='text-gray-400'>
              Place <code className='text-blue-500'>projects.json</code> in your{' '}
              <code className='text-blue-500'>/public</code> folder and restart
              the dev server.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className='text-center text-gray-400 text-sm py-16'>
            No projects match your filters
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5'>
            {filtered.map(p => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
