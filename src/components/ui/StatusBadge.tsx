import type { Project } from '../../types/index';

// ── Status Badge ──────────────────────────────────────────────────────────────

const statusConfig: Record<
  Project['status'],
  { className: string; label: string }
> = {
  active: { className: 'bg-blue-600 text-white', label: 'Active' },
  development: { className: 'bg-amber-500 text-white', label: 'Development' },
  archived: { className: 'bg-gray-400 text-white', label: 'Archived' },
};

export function StatusBadge({ status }: { status: Project['status'] }) {
  const { className, label } = statusConfig[status] ?? statusConfig.active;
  return (
    <span
      className={`${className} text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase shadow-sm`}
    >
      {label}
    </span>
  );
}

// ── Repo Type Badge ───────────────────────────────────────────────────────────

const repoTypeConfig: Record<
  Project['repoType'],
  { className: string; label: string }
> = {
  orgprojects: {
    className: 'bg-rose-100 text-rose-700 border border-rose-200',
    label: 'Org Projects',
  },
  community: {
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
    label: 'Community',
  },
};

export function RepoTypeBadge({ repoType }: { repoType: Project['repoType'] }) {
  const { className, label } =
    repoTypeConfig[repoType] ?? repoTypeConfig.community;
  return (
    <span
      className={`${className} text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase`}
    >
      {label}
    </span>
  );
}

// ── Category Badge ────────────────────────────────────────────────────────────

const categoryConfig: Record<
  Project['category'],
  { className: string; label: string }
> = {
  law: {
    className: 'bg-red-100 text-red-700 border border-red-200',
    label: 'Law',
  },
  money: {
    className: 'bg-green-100 text-green-700 border border-green-200',
    label: 'Money',
  },
  data: {
    className: 'bg-sky-100 text-sky-700 border border-sky-200',
    label: 'Data',
  },
  election: {
    className: 'bg-purple-100 text-purple-700 border border-purple-200',
    label: 'Election',
  },
  health: {
    className: 'bg-pink-100 text-pink-700 border border-pink-200',
    label: 'Health',
  },
  infrastructure: {
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    label: 'Infrastructure',
  },
  other: {
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
    label: 'Other',
  },
};

export function CategoryBadge({ category }: { category: Project['category'] }) {
  const { className, label } = categoryConfig[category] ?? categoryConfig.other;
  return (
    <span
      className={`${className} text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase`}
    >
      {label}
    </span>
  );
}
