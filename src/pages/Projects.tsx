import { useState, useEffect, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Project {
  slug: string;
  title: string;
  description: string;
  repositoryUrls: string[];
  projectUrl: string;
  status: 'active' | 'archived' | 'incubating';
}

type Tab = 'showcase' | 'pending' | 'completed';

// ── Derived display helpers ──────────────────────────────────────────────────

function bannerBg(slug: string): string {
  // Deterministic colour from slug hash so every project gets a stable dark bg
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const hue = hash % 360;
  return `hsl(${hue} 40% 8%)`;
}

function orgFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[0] ?? '';
  } catch {
    return '';
  }
}

function repoFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[1] ?? '';
  } catch {
    return '';
  }
}

// ── Banner SVG ───────────────────────────────────────────────────────────────

function Banner({ slug, bg }: { slug: string; bg: string }) {
  const accent = '#1a5fb4';
  const dim = '#ffffff10';

  // Pick one of 4 patterns deterministically
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const variant = hash % 4;

  return (
    <svg
      viewBox='0 0 420 148'
      xmlns='http://www.w3.org/2000/svg'
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      preserveAspectRatio='xMidYMid slice'
    >
      <rect width='420' height='148' fill={bg} />
      {variant === 0 &&
        Array.from({ length: 8 }, (_, i) =>
          Array.from({ length: 5 }, (_, j) => (
            <rect
              key={`${i}-${j}`}
              x={i * 54}
              y={j * 34}
              width='42'
              height='24'
              rx='3'
              fill='none'
              stroke={dim}
              strokeWidth='0.5'
            />
          ))
        )}
      {variant === 0 && (
        <>
          <rect
            x='75'
            y='34'
            width='130'
            height='24'
            rx='3'
            fill={accent}
            opacity='0.28'
          />
          <rect
            x='225'
            y='68'
            width='80'
            height='24'
            rx='3'
            fill={accent}
            opacity='0.16'
          />
          <circle
            cx='330'
            cy='90'
            r='22'
            fill='none'
            stroke={accent}
            strokeWidth='1'
            opacity='0.3'
          />
        </>
      )}
      {variant === 1 && (
        <>
          {Array.from({ length: 14 }, (_, i) =>
            Array.from({ length: 6 }, (_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={i * 32 + 16}
                cy={j * 28 + 14}
                r='2'
                fill={dim}
              />
            ))
          )}
          <circle
            cx='185'
            cy='74'
            r='44'
            fill='none'
            stroke={accent}
            strokeWidth='0.8'
            opacity='0.25'
          />
          <circle cx='300' cy='50' r='26' fill={accent} opacity='0.12' />
        </>
      )}
      {variant === 2 && (
        <>
          {[42, 78, 52, 105, 68, 90, 44, 76].map((h, i) => (
            <rect
              key={i}
              x={28 + i * 50}
              y={136 - h}
              width='36'
              height={h}
              rx='3'
              fill={accent}
              opacity={i % 2 === 0 ? 0.28 : 0.14}
            />
          ))}
          <line
            x1='18'
            y1='136'
            x2='418'
            y2='136'
            stroke={dim}
            strokeWidth='0.5'
          />
        </>
      )}
      {variant === 3 && (
        <>
          <circle
            cx='210'
            cy='74'
            r='60'
            fill='none'
            stroke={dim}
            strokeWidth='1'
          />
          <circle
            cx='210'
            cy='74'
            r='42'
            fill='none'
            stroke={accent}
            strokeWidth='0.8'
            opacity='0.22'
          />
          <circle cx='210' cy='74' r='24' fill={accent} opacity='0.1' />
          <circle
            cx='320'
            cy='34'
            r='30'
            fill='none'
            stroke={dim}
            strokeWidth='0.8'
          />
          <circle
            cx='88'
            cy='108'
            r='20'
            fill='none'
            stroke={dim}
            strokeWidth='0.8'
          />
        </>
      )}
    </svg>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Project['status'] }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: '#1a5fb4', color: '#e6f1fb', label: 'Active' },
    incubating: { bg: '#7c4a03', color: '#fef3c7', label: 'Incubating' },
    archived: { bg: '#2a2a2a', color: '#9ca3af', label: 'Archived' },
  };
  const s = styles[status] ?? styles.active;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 4,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const bg = bannerBg(project.slug);
  const primaryRepo = project.repositoryUrls[0] ?? project.projectUrl;
  const org = orgFromUrl(primaryRepo);
  const repo = repoFromUrl(primaryRepo);

  return (
    <div
      style={{
        background: '#111827',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #1e2d3d',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Banner */}
      <div style={{ position: 'relative', height: 148, flexShrink: 0 }}>
        <Banner slug={project.slug} bg={bg} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, transparent 35%, #111827f2 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 11,
            left: 13,
            display: 'flex',
            gap: 5,
          }}
        >
          <StatusBadge status={project.status} />
        </div>
        {/* org/repo shown at bottom of banner */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 14,
            fontSize: 11,
            color: '#4da6ff88',
            fontFamily: 'monospace',
          }}
        >
          {org && repo ? `${org} / ${repo}` : ''}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#f0f4f8',
              lineHeight: 1.25,
            }}
          >
            {project.title}
          </span>
        </div>

        <p
          style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}
        >
          {project.description}
        </p>

        {/* Repo links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {project.repositoryUrls.map(url => (
            <a
              key={url}
              href={url}
              style={{
                fontSize: 12,
                color: '#4da6ff88',
                textDecoration: 'none',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {url.replace('https://', '')}
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '9px 16px',
          borderTop: '1px solid #1e2d3d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <a
          href={project.projectUrl}
          style={{
            fontSize: 12,
            color: '#6b7280',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '55%',
          }}
        >
          {project.projectUrl.replace('https://', '')}
        </a>
        <a
          href={project.projectUrl}
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: '#4da6ff',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View Details →
        </a>
      </div>
    </div>
  );
}

// ── Loading / Error states ────────────────────────────────────────────────────

function LoadingGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: '#111827',
            borderRadius: 12,
            border: '1px solid #1e2d3d',
            height: 300,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function ProjectRegistry() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('showcase');
  const [search, setSearch] = useState('');

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
      showcase: projects.length,
      pending: projects.filter(p => p.status === 'incubating').length,
      completed: projects.filter(p => p.status === 'archived').length,
    }),
    [projects]
  );

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (tab === 'pending' && p.status !== 'incubating') return false;
      if (tab === 'completed' && p.status !== 'archived') return false;
      const q = search.toLowerCase();
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [projects, tab, search]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'showcase', label: 'Showcase' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div
      style={{
        background: '#0d1117',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #1e2d3d',
          marginBottom: '1.25rem',
          justifyContent: 'flex-end',
        }}
      >
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '9px 18px',
              background: 'none',
              border: 'none',
              borderBottom:
                tab === t.key ? '2px solid #4da6ff' : '2px solid transparent',
              color: tab === t.key ? '#4da6ff' : '#6b7280',
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: -1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.label}
            <span
              style={{
                background: tab === t.key ? '#1a3a5c' : '#1e2d3d',
                color: tab === t.key ? '#4da6ff' : '#6b7280',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10,
              }}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              fontSize: 14,
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search projects...'
            style={{
              width: '100%',
              background: '#161d2b',
              border: '1px solid #1e2d3d',
              borderRadius: 8,
              color: '#f0f4f8',
              padding: '8px 12px 8px 34px',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* States */}
      {loading && <LoadingGrid />}

      {error && (
        <div
          style={{
            background: '#1a0a0a',
            border: '1px solid #3d1a1a',
            borderRadius: 10,
            padding: '1.5rem',
            color: '#f09595',
            fontSize: 13,
          }}
        >
          <strong>Could not load projects.json</strong>
          <p style={{ marginTop: 6, color: '#9ca3af' }}>{error}</p>
          <p style={{ marginTop: 4, color: '#6b7280' }}>
            Place <code style={{ color: '#4da6ff' }}>projects.json</code> in
            your <code style={{ color: '#4da6ff' }}>/public</code> folder and
            restart the dev server.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: '#6b7280',
            padding: '4rem 0',
            fontSize: 14,
          }}
        >
          No projects match your filters
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map(p => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
