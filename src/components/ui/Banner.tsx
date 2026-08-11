import type { Project } from '../../types/index';

function bannerBg(slug: string): string {
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const hue = hash % 360;
  return `hsl(${hue} 45% 88%)`;
}

function patternVariant(slug: string): number {
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return hash % 4;
}

function SvgPattern({ slug }: { slug: string }) {
  const bg = bannerBg(slug);
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const hue = hash % 360;
  const accent = `hsl(${hue} 55% 45%)`;
  const dim = `hsl(${hue} 30% 70% / 0.4)`;
  const variant = patternVariant(slug);

  return (
    <svg
      viewBox='0 0 420 148'
      xmlns='http://www.w3.org/2000/svg'
      className='absolute inset-0 w-full h-full'
      preserveAspectRatio='xMidYMid slice'
    >
      <rect width='420' height='148' fill={bg} />
      {variant === 0 && (
        <>
          {Array.from({ length: 8 }, (_, i) =>
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
          <rect
            x='75'
            y='34'
            width='130'
            height='24'
            rx='3'
            fill={accent}
            opacity='0.22'
          />
          <rect
            x='225'
            y='68'
            width='80'
            height='24'
            rx='3'
            fill={accent}
            opacity='0.12'
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
            opacity='0.3'
          />
          <circle cx='300' cy='50' r='26' fill={accent} opacity='0.15' />
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
              opacity={i % 2 === 0 ? 0.3 : 0.15}
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
            opacity='0.25'
          />
          <circle cx='210' cy='74' r='24' fill={accent} opacity='0.12' />
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

interface BannerProps {
  project: Pick<Project, 'slug' | 'imageUrl'>;
}

export function Banner({ project }: BannerProps) {
  if (project.imageUrl) {
    return (
      <>
        <img
          src={project.imageUrl}
          alt=''
          aria-hidden='true'
          loading='lazy'
          decoding='async'
          className='absolute inset-0 w-full h-full object-cover'
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className='absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/50' />
      </>
    );
  }

  return (
    <>
      <SvgPattern slug={project.slug} />
      <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/20' />
    </>
  );
}
