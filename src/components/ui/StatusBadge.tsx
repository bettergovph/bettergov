import type { Project } from '../../types/index';

interface StatusBadgeProps {
  status: Project['status'];
}

const config: Record<Project['status'], { className: string; label: string }> =
  {
    active: {
      className: 'bg-blue-600 text-white',
      label: 'Active',
    },
    development: {
      className: 'bg-amber-500 text-white',
      label: 'Development',
    },
    archived: {
      className: 'bg-gray-400 text-white',
      label: 'Archived',
    },
  };

export function StatusBadge({ status }: StatusBadgeProps) {
  const { className, label } = config[status] ?? config.active;
  return (
    <span
      className={`${className} text-[10px] font-semibold px-2 py-0.5 rounded tracking-wider uppercase shadow-sm`}
    >
      {label}
    </span>
  );
}
