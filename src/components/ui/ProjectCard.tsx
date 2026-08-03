import { useState, useEffect, useRef } from 'react';
import type { Project } from '../../types/index';
import { Banner } from '../ui/Banner';
import { StatusBadge, RepoTypeBadge, CategoryBadge } from '../ui/StatusBadge';

// ── Helpers ───────────────────────────────────────────────────────────────────

function orgFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[0] ?? '';
  } catch {
    return '';
  }
}

function repoFromUrl(url: string): string {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[1] ?? '';
  } catch {
    return '';
  }
}

function slugFromUrl(url: string): string {
  const org = orgFromUrl(url);
  const repo = repoFromUrl(url);
  return org && repo ? `${org}/${repo}` : '';
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let value = seconds;
  let unitName = 'second';
  for (const [divisor, name] of units) {
    if (value < divisor) {
      unitName = name;
      break;
    }
    value = Math.floor(value / divisor);
    unitName = name;
  }
  return `${value} ${unitName}${value === 1 ? '' : 's'} ago`;
}

function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── localStorage cache with ETag support ─────────────────────────────────────
// Sends If-None-Match on repeat loads; 304s don't count against the rate limit.

const LS_PREFIX = 'ghcache:';
const CACHE_TTL_MS = 5 * 60 * 1000; // re-validate after 5 min

interface StoredEntry<T> {
  etag: string | null;
  data: T;
  ts: number;
}

function lsGet<T>(key: string): StoredEntry<T> | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as StoredEntry<T>) : null;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, entry: StoredEntry<T>): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota exceeded or private mode
  }
}

// ── In-memory dedup cache ─────────────────────────────────────────────────────
// Shares one in-flight Promise per slug so concurrent card renders don't
// each fire their own request.

const inflightCache = new Map<string, Promise<unknown>>();

async function ghFetchOnce<T>(
  slug: string,
  path: string,
  fallback: T
): Promise<T> {
  const key = `${slug}${path}`;
  const stored = lsGet<T>(key);
  const now = Date.now();

  if (stored && now - stored.ts < CACHE_TTL_MS) return stored.data;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (stored?.etag) headers['If-None-Match'] = stored.etag;

  const res = await fetch(`https://api.github.com/repos/${slug}${path}`, {
    headers,
  });

  if (res.status === 304 && stored) {
    lsSet(key, { ...stored, ts: now });
    return stored.data;
  }

  // Rate limited — return stale cache if available
  if (res.status === 403 || res.status === 429) return stored?.data ?? fallback;

  if (!res.ok) return stored?.data ?? fallback;

  const data = (await res.json()) as T;
  lsSet(key, { etag: res.headers.get('ETag'), data, ts: now });
  return data;
}

function ghFetch<T>(slug: string, path: string, fallback: T): Promise<T> {
  const key = `${slug}${path}`;
  if (inflightCache.has(key)) return inflightCache.get(key) as Promise<T>;
  const p = ghFetchOnce<T>(slug, path, fallback).finally(() => {
    inflightCache.set(key, p);
  });
  inflightCache.set(key, p);
  return p;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface GitHubRepoMeta {
  pushed_at?: string;
  created_at?: string; // ← new
}

interface ProjectGitHubData {
  contributors: GitHubContributor[];
  lastUpdated: Date | null;
  createdAt: Date | null; // ← new
}

// ── GitHub data fetcher ───────────────────────────────────────────────────────

async function fetchProjectGitHubData(
  repositoryUrls: string[]
): Promise<ProjectGitHubData> {
  const slugs = [
    ...new Set(
      repositoryUrls
        .filter(u => u.includes('github.com'))
        .map(slugFromUrl)
        .filter(Boolean)
    ),
  ];

  if (slugs.length === 0)
    return { contributors: [], lastUpdated: null, createdAt: null };

  const [contributorResults, repoMetaResults] = await Promise.all([
    Promise.allSettled(
      slugs.map(slug =>
        ghFetch<GitHubContributor[]>(slug, '/contributors?per_page=100', [])
      )
    ),
    Promise.allSettled(
      slugs.map(slug => ghFetch<GitHubRepoMeta>(slug, '', {}))
    ),
  ]);

  // Merge contributors across repos, skip bots
  const map = new Map<string, GitHubContributor>();
  for (const result of contributorResults) {
    if (result.status !== 'fulfilled') continue;
    const list = Array.isArray(result.value) ? result.value : [];
    for (const c of list) {
      if (c.login?.endsWith('[bot]')) continue;
      const existing = map.get(c.login);
      if (existing) existing.contributions += c.contributions;
      else map.set(c.login, { ...c });
    }
  }

  // Pick most recent pushed_at and earliest created_at across repos
  let lastUpdated: Date | null = null;
  let createdAt: Date | null = null;

  for (const result of repoMetaResults) {
    if (result.status !== 'fulfilled') continue;
    const meta = result.value as GitHubRepoMeta;

    if (meta?.pushed_at) {
      const d = new Date(meta.pushed_at);
      if (!lastUpdated || d > lastUpdated) lastUpdated = d;
    }

    if (meta?.created_at) {
      const d = new Date(meta.created_at);
      if (!createdAt || d < createdAt) createdAt = d; // earliest wins
    }
  }

  return {
    contributors: Array.from(map.values()).sort(
      (a, b) => b.contributions - a.contributions
    ),
    lastUpdated,
    createdAt,
  };
}

// ── useInView ─────────────────────────────────────────────────────────────────
// Fires once when the element enters the viewport, then disconnects.

function useInView<T extends Element>(
  rootMargin = '200px'
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}

// ── useProjectGitHubData ──────────────────────────────────────────────────────

type GitHubDataState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; data: ProjectGitHubData }
  | { status: 'error' };

function useProjectGitHubData(project: Project, enabled: boolean) {
  const [state, setState] = useState<GitHubDataState>({ status: 'idle' });

  useEffect(() => {
    if (!enabled) return;

    if (project.repositoryUrls.length === 0) {
      setState({
        status: 'done',
        data: { contributors: [], lastUpdated: null, createdAt: null },
      });
      return;
    }

    setState({ status: 'loading' });
    fetchProjectGitHubData(project.repositoryUrls)
      .then(data => setState({ status: 'done', data }))
      .catch(() => setState({ status: 'error' }));
  }, [enabled, project]);

  return state;
}

// ── Last updated badge ────────────────────────────────────────────────────────

function lastUpdatedTier(date: Date) {
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 30)
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      dot: 'bg-green-500',
    };
  if (days <= 182)
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  return {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };
}

function LastUpdatedBadge({ date }: { date: Date }) {
  const tier = lastUpdatedTier(date);
  return (
    <span
      title={formatAbsoluteDate(date)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${tier.bg} ${tier.text} ${tier.border} text-[11.5px] font-semibold whitespace-nowrap shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot} shrink-0`} />
      Updated {formatRelativeTime(date)}
    </span>
  );
}

// ── Created at badge ──────────────────────────────────────────────────────────

function CreatedAtBadge({ date }: { date: Date }) {
  return (
    <span
      title={`Created ${formatAbsoluteDate(date)}`}
      className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-50 text-slate-500 border-slate-200 text-[11.5px] font-semibold whitespace-nowrap shrink-0'
    >
      {/* Calendar icon */}
      <svg
        className='w-3 h-3 shrink-0'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        viewBox='0 0 24 24'
      >
        <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
        <line x1='16' y1='2' x2='16' y2='6' />
        <line x1='8' y1='2' x2='8' y2='6' />
        <line x1='3' y1='10' x2='21' y2='10' />
      </svg>
      {formatAbsoluteDate(date)}
    </span>
  );
}

// ── Contributor pill ──────────────────────────────────────────────────────────

function ContributorPill({ contributor }: { contributor: GitHubContributor }) {
  return (
    <a
      href={contributor.html_url}
      target='_blank'
      rel='noopener noreferrer'
      className='flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group'
    >
      <img
        src={contributor.avatar_url}
        alt={contributor.login}
        loading='lazy'
        decoding='async'
        className='w-5 h-5 rounded-full object-cover'
      />
      <span className='text-[12px] text-gray-600 group-hover:text-blue-600 font-medium'>
        {contributor.login}
      </span>
      {contributor.contributions > 0 && (
        <span className='text-[10px] text-gray-400 ml-auto'>
          {contributor.contributions}
        </span>
      )}
    </a>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ProjectModal({
  project,
  githubData,
  onClose,
}: {
  project: Project;
  githubData: GitHubDataState;
  onClose: () => void;
}) {
  const primaryRepo = project.repositoryUrls[0] ?? project.projectUrl;
  const org = orgFromUrl(primaryRepo);
  const repo = repoFromUrl(primaryRepo);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
      style={{ animation: 'fadeIn 0.15s ease both' }}
      onClick={onClose}
    >
      <div
        className='relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden'
        style={{
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div className='relative h-56 shrink-0'>
          <Banner project={project} />
          <div className='absolute top-3 left-4 z-10 flex flex-wrap gap-1.5'>
            <StatusBadge status={project.status} />
            <RepoTypeBadge repoType={project.repoType} />
            <CategoryBadge category={project.category} />
          </div>
          {org && repo && (
            <div className='absolute bottom-3 left-4 z-10 text-[12px] text-white/75 font-mono drop-shadow'>
              {org} / {repo}
            </div>
          )}
          <button
            onClick={onClose}
            className='absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm'
            aria-label='Close'
          >
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M18 6 6 18M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className='overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5'>
          <div className='flex flex-col gap-1'>
            {/* Title row: name + last-updated badge */}
            <div className='flex items-center justify-between gap-3 flex-wrap'>
              <h2 className='text-2xl font-bold text-gray-900 leading-tight'>
                {project.title}
              </h2>
              {githubData.status === 'done' && githubData.data.lastUpdated && (
                <LastUpdatedBadge date={githubData.data.lastUpdated} />
              )}
            </div>

            {/* URL + created-at badge on the same row */}
            <div className='flex items-center gap-2.5 flex-wrap'>
              <a
                href={project.projectUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-blue-500 hover:text-blue-600 transition-colors'
              >
                {project.projectUrl}
              </a>
              {githubData.status === 'done' && githubData.data.createdAt && (
                <CreatedAtBadge date={githubData.data.createdAt} />
              )}
            </div>
          </div>

          <div>
            <h4 className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5'>
              About
            </h4>
            <p className='text-[14.5px] text-gray-600 leading-relaxed'>
              {project.description}
            </p>
          </div>

          {project.repositoryUrls.length > 0 && (
            <div>
              <h4 className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2'>
                Contributors
              </h4>
              {githubData.status === 'loading' && (
                <div className='flex flex-wrap gap-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className='h-8 w-28 rounded-lg bg-gray-100 animate-pulse'
                    />
                  ))}
                </div>
              )}
              {githubData.status === 'error' && (
                <p className='text-[13px] text-gray-400'>
                  Could not load contributors.
                </p>
              )}
              {githubData.status === 'done' &&
                githubData.data.contributors.length === 0 && (
                  <p className='text-[13px] text-gray-400'>
                    No contributors found.
                  </p>
                )}
              {githubData.status === 'done' &&
                githubData.data.contributors.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {githubData.data.contributors.map(c => (
                      <ContributorPill key={c.login} contributor={c} />
                    ))}
                  </div>
                )}
            </div>
          )}

          {project.repositoryUrls.length > 0 && (
            <div>
              <h4 className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2'>
                {project.repositoryUrls.length === 1
                  ? 'Repository'
                  : 'Repositories'}
              </h4>
              <div className='flex flex-col gap-2'>
                {project.repositoryUrls.map(url => (
                  <a
                    key={url}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group'
                  >
                    <svg
                      className='w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z' />
                    </svg>
                    <span className='text-[12.5px] text-gray-600 font-mono group-hover:text-blue-600 truncate'>
                      {url.replace('https://', '')}
                    </span>
                    <svg
                      className='w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 ml-auto shrink-0'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3' />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className='px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80'>
          <span className='text-xs text-gray-400'>
            {githubData.status === 'done' &&
            githubData.data.contributors.length > 0
              ? `${githubData.data.contributors.length} contributor${githubData.data.contributors.length === 1 ? '' : 's'}`
              : project.repositoryUrls.length > 0
                ? `${project.repositoryUrls.length} ${project.repositoryUrls.length === 1 ? 'repository' : 'repositories'}`
                : 'No public repositories'}
          </span>
          <a
            href={project.projectUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors'
          >
            Visit Project
            <svg
              className='w-3.5 h-3.5'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
            >
              <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3' />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [open, setOpen] = useState(false);
  const primaryRepo = project.repositoryUrls[0] ?? project.projectUrl;
  const org = orgFromUrl(primaryRepo);
  const repo = repoFromUrl(primaryRepo);

  // Defer fetch until the card is near the viewport
  const [cardRef, inView] = useInView<HTMLDivElement>('200px');
  const githubData = useProjectGitHubData(project, inView);

  return (
    <>
      <div
        ref={cardRef}
        className='bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-200 cursor-pointer'
        onClick={() => setOpen(true)}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(true);
        }}
      >
        {/* Banner */}
        <div className='relative h-36 shrink-0'>
          <Banner project={project} />
          <div className='absolute top-2.5 left-3 z-10 flex flex-wrap gap-1'>
            <StatusBadge status={project.status} />
            <RepoTypeBadge repoType={project.repoType} />
          </div>
          <div className='absolute top-2.5 right-3 z-10'>
            <CategoryBadge category={project.category} />
          </div>
          {org && repo && (
            <div className='absolute bottom-2.5 left-3.5 z-10 text-[11px] text-white/70 font-mono drop-shadow'>
              {org} / {repo}
            </div>
          )}
        </div>

        {/* Body */}
        <div className='flex flex-col gap-2 px-4 pt-3.5 pb-2.5 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='text-[15px] font-semibold text-gray-900 leading-snug'>
              {project.title}
            </h3>
            {githubData.status === 'done' && githubData.data.lastUpdated && (
              <LastUpdatedBadge date={githubData.data.lastUpdated} />
            )}
          </div>
          <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-2'>
            {project.description}
          </p>
          {project.repositoryUrls.length > 0 && (
            <div className='flex flex-col gap-1 mt-0.5'>
              {project.repositoryUrls.map(url => (
                <span
                  key={url}
                  className='text-[11.5px] text-gray-400 font-mono truncate'
                >
                  {url.replace('https://', '')}
                </span>
              ))}
            </div>
          )}
          {/* Created-at inline, styled to match repo URL text */}
          {githubData.status === 'done' && githubData.data.createdAt && (
            <span className='text-[11.5px] text-gray-400 flex items-center gap-1'>
              <svg
                className='w-3 h-3 shrink-0'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                <line x1='16' y1='2' x2='16' y2='6' />
                <line x1='8' y1='2' x2='8' y2='6' />
                <line x1='3' y1='10' x2='21' y2='10' />
              </svg>
              Created {formatAbsoluteDate(githubData.data.createdAt)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100'>
          {githubData.status === 'loading' && (
            <div className='flex -space-x-1.5'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='w-6 h-6 rounded-full bg-gray-100 animate-pulse border-2 border-white'
                />
              ))}
            </div>
          )}

          {githubData.status === 'done' &&
            githubData.data.contributors.length > 0 && (
              <div className='flex items-center gap-1.5'>
                <div className='flex -space-x-2'>
                  {githubData.data.contributors.slice(0, 5).map(c => (
                    <a
                      key={c.login}
                      href={c.html_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      title={c.login}
                      onClick={e => e.stopPropagation()}
                    >
                      <img
                        src={c.avatar_url}
                        alt={c.login}
                        loading='lazy'
                        decoding='async'
                        className='w-6 h-6 rounded-full border-2 border-white object-cover hover:scale-110 transition-transform'
                      />
                    </a>
                  ))}
                </div>
                {githubData.data.contributors.length > 5 && (
                  <span className='text-xs text-gray-400'>
                    +{githubData.data.contributors.length - 5}
                  </span>
                )}
              </div>
            )}

          {(githubData.status === 'done' &&
            githubData.data.contributors.length === 0) ||
          githubData.status === 'error' ||
          githubData.status === 'idle' ? (
            <span className='text-[11.5px] text-gray-400 truncate max-w-[55%]'>
              {project.projectUrl.replace('https://', '')}
            </span>
          ) : null}

          <span className='text-[12px] font-semibold text-blue-600 whitespace-nowrap'>
            View Details →
          </span>
        </div>
      </div>

      {open && (
        <ProjectModal
          project={project}
          githubData={githubData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
