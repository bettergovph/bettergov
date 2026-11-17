import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import Container from '../ui/Container';
import './heritage.css';

export type HeritageImage = {
  name: string;
  alt: string;
  caption: string;
  creator: string;
  source: string;
  license: string;
  licenseUrl: string;
  creatorUrl?: string;
};

export function HeritagePhoto({
  image,
  hero = false,
}: {
  image: HeritageImage;
  hero?: boolean;
}) {
  return (
    <img
      src={`/assets/heritage/${image.name}.webp`}
      srcSet={`/assets/heritage/${image.name}-800.webp 800w, /assets/heritage/${image.name}.webp ${image.name === 'weaving' ? 1208 : 1600}w`}
      sizes={hero ? '100vw' : '(min-width: 1024px) 50vw, 100vw'}
      alt={image.alt}
      width={image.name === 'weaving' ? 1208 : 1600}
      height={
        image.name === 'adobo' ? 1200 : image.name === 'weaving' ? 800 : 1067
      }
      loading={hero ? 'eager' : 'lazy'}
      fetchPriority={hero ? 'high' : 'auto'}
      decoding='async'
    />
  );
}

export function PhotoCredit({ image }: { image: HeritageImage }) {
  return (
    <span className='heritage-credit'>
      {image.caption} · <a href={image.source}>{image.creator}</a>
      {image.creatorUrl && (
        <>
          {' '}
          / <a href={image.creatorUrl}>WayPH</a>
        </>
      )}
      {' · '}
      <a href={image.licenseUrl}>{image.license}</a> · Cropped
    </span>
  );
}

export function HeritageHero({
  title,
  eyebrow,
  description,
  image,
  cta,
  href,
  children,
}: {
  title: ReactNode;
  eyebrow: string;
  description: string;
  image: HeritageImage;
  cta: string;
  href: string;
  children?: ReactNode;
}) {
  // Resolve incoming chapter links once fonts have settled, so late font
  // layout changes do not leave a timeline entry below the viewport.
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className='heritage-hero'>
      <HeritagePhoto image={image} hero />
      <div className='heritage-hero-shade' />
      <Container className='heritage-hero-content'>
        <p className='heritage-kicker'>{eyebrow}</p>
        <h1>{title}</h1>
        <p className='heritage-hero-description'>{description}</p>
        <a className='heritage-hero-cta' href={href}>
          {cta}
          <ArrowDown size={18} aria-hidden='true' />
        </a>
        {children}
        <div className='heritage-hero-caption'>
          <PhotoCredit image={image} />
        </div>
      </Container>
    </header>
  );
}

export function ChapterNav({
  label,
  items,
  lang,
}: {
  label: string;
  items: { id: string; label: string }[];
  lang?: string;
}) {
  return (
    <nav className='heritage-chapter-nav' aria-label={label} lang={lang}>
      <Container>
        <ol>
          {items.map((item, index) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>
                <span aria-hidden='true'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </Container>
    </nav>
  );
}

export function HeritageChapter({
  id,
  number,
  label,
  title,
  children,
  dark = false,
}: {
  id: string;
  number: string;
  label: string;
  title: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`heritage-chapter${dark ? ' heritage-dark' : ''}`}
    >
      <Container>
        <div className='heritage-chapter-grid'>
          <div className='heritage-chapter-label'>
            <span aria-hidden='true'>{number}</span>
            <p className='heritage-kicker'>{label}</p>
          </div>
          <div className='min-w-0'>
            <h2 id={`${id}-title`}>{title}</h2>
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ReferenceLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className='heritage-reference' href={href}>
      {children}
      <ArrowUpRight size={14} aria-hidden='true' />
    </a>
  );
}

export function HeritageNext({
  to,
  label,
  title,
  description,
}: {
  to: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <section className='heritage-next'>
      <Container>
        <Link to={to}>
          <div>
            <p className='heritage-kicker'>{label}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <ArrowRight size={36} aria-hidden='true' />
        </Link>
      </Container>
    </section>
  );
}
