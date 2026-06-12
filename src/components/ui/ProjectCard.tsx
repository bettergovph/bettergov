import type { Project } from '../../types/index';
import { Banner } from '../ui/Banner';
import { StatusBadge } from '../ui/StatusBadge';
import { useState, useEffect } from 'react';

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

// ── Modal ─────────────────────────────────────────────────────────────────────

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const primaryRepo = project.repositoryUrls[0] ?? project.projectUrl;
  const org = orgFromUrl(primaryRepo);
  const repo = repoFromUrl(primaryRepo);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    // Backdrop
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200'
      onClick={onClose}
    >
      {/* Modal panel — stop propagation so clicks inside don't close */}
      <div
        className='relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden'
        style={{
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Banner ───────────────────────────────────────────────────────── */}
        <div className='relative h-56 shrink-0'>
          <Banner project={project} />

          <div className='absolute top-3 left-4 z-10'>
            <StatusBadge status={project.status} />
          </div>

          {org && repo && (
            <div className='absolute bottom-3 left-4 z-10 text-[12px] text-white/75 font-mono drop-shadow'>
              {org} / {repo}
            </div>
          )}

          {/* Close button */}
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

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className='overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5'>
          {/* Title + URL */}
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold text-gray-900 leading-tight'>
              {project.title}
            </h2>
            <a
              href={project.projectUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-sm text-blue-500 hover:text-blue-600 transition-colors'
            >
              {project.projectUrl}
            </a>
          </div>

          {/* Description */}
          <div>
            <h4 className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5'>
              About
            </h4>
            <p className='text-[14.5px] text-gray-600 leading-relaxed'>
              {project.description}
            </p>
          </div>

          {/* Repositories */}
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
                    {/* GitHub icon */}
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

        {/* ── Footer CTA ────────────────────────────────────────────────────── */}
        <div className='px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/80'>
          <span className='text-xs text-gray-400'>
            {project.repositoryUrls.length > 0
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

      {/* Keyframe for modal pop-in */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
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

  return (
    <>
      <div
        className='bg-white rounded-xl overflow-hidden border border-gray-200 flex flex-col shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-200 cursor-pointer'
        onClick={() => setOpen(true)}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setOpen(true);
        }}
      >
        {/* ── Banner ───────────────────────────────────────────────────────── */}
        <div className='relative h-36 shrink-0'>
          <Banner project={project} />
          <div className='absolute top-2.5 left-3 z-10'>
            <StatusBadge status={project.status} />
          </div>
          {org && repo && (
            <div className='absolute bottom-2.5 left-3.5 z-10 text-[11px] text-white/70 font-mono drop-shadow'>
              {org} / {repo}
            </div>
          )}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className='flex flex-col gap-2 px-4 pt-3.5 pb-2.5 flex-1'>
          <h3 className='text-[15px] font-semibold text-gray-900 leading-snug'>
            {project.title}
          </h3>
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
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className='flex items-center justify-between gap-2 px-4 py-2.5 border-t border-gray-100'>
          <span className='text-[11.5px] text-gray-400 truncate max-w-[55%]'>
            {project.projectUrl.replace('https://', '')}
          </span>
          <span className='text-[12px] font-semibold text-blue-600 whitespace-nowrap'>
            View Details →
          </span>
        </div>
      </div>

      {open && (
        <ProjectModal project={project} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
