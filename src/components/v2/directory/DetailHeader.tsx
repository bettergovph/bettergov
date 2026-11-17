import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import Container from '../ui/Container';

export type DetailCrumb = { label: ReactNode; to?: string };

type Props = {
  /** Small mono label row above the title. */
  /** Breadcrumb trail shown above the title. */
  breadcrumbs?: DetailCrumb[];
  /** Main serif title. */
  title: ReactNode;
  /** Optional serif lede / description. */
  lede?: ReactNode;
  address?: string;
  trunkline?: string;
  website?: string;
  email?: string;
  /** Extra content rendered below the contact strip (buttons, tags, etc.). */
  children?: ReactNode;
};

const stripProtocol = (w: string) =>
  w.replace(/^https?:\/\//i, '').replace(/\/$/, '');

const normalizeUrl = (w: string) => (w.startsWith('http') ? w : `https://${w}`);

const DetailHeader: FC<Props> = ({
  breadcrumbs,
  title,
  lede,
  address,
  trunkline,
  website,
  email,
  children,
}) => (
  <section className='border-b border-ed-ink bg-ed-paper-2 py-12 max-md:py-6'>
    <Container>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label='Breadcrumb'
          className='mb-4 font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3 max-md:mb-2.5 max-md:text-[10px]'
        >
          {breadcrumbs.map((c, i) => (
            <span key={i}>
              {c.to ? (
                <Link
                  to={c.to}
                  className='text-ed-ink-3 no-underline hover:text-ed-navy'
                >
                  {c.label}
                </Link>
              ) : (
                <span className='text-ed-ink'>{c.label}</span>
              )}
              {i < breadcrumbs.length - 1 && ' / '}
            </span>
          ))}
        </nav>
      )}

      <h1 className='font-serif-ed text-[clamp(32px,5vw,56px)] font-bold leading-[1.04] tracking-[-0.02em] text-ed-ink max-md:text-[26px]'>
        {title}
      </h1>

      {lede && (
        <p className='mt-4 max-w-3xl font-sans-ed text-lg leading-relaxed text-ed-ink-2 max-md:mt-2.5 max-md:text-[15px] max-md:leading-snug'>
          {lede}
        </p>
      )}

      {(address || trunkline || website || email) && (
        <dl className='mt-6 grid grid-cols-1 gap-x-10 gap-y-2 text-sm text-ed-ink-2 max-md:mt-4 max-md:gap-y-1.5 max-md:text-[13px] md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]'>
          {address && (
            <div className='flex items-start gap-2'>
              <MapPinIcon
                size={16}
                className='mt-0.5 shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <span>{address}</span>
            </div>
          )}
          {trunkline && (
            <div className='flex items-start gap-2'>
              <PhoneIcon
                size={16}
                className='mt-0.5 shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <span className='font-mono-ed'>{trunkline}</span>
            </div>
          )}
          {website && (
            <div className='flex items-start gap-2'>
              <ExternalLinkIcon
                size={16}
                className='mt-0.5 shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <a
                href={normalizeUrl(website)}
                target='_blank'
                rel='noreferrer'
                className='break-all border-b border-ed-navy pb-0.5 font-sans-ed text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
              >
                {stripProtocol(website)}
              </a>
            </div>
          )}
          {email && (
            <div className='flex items-start gap-2'>
              <MailIcon
                size={16}
                className='mt-0.5 shrink-0 text-ed-ink-3'
                aria-hidden
              />
              <a
                href={`mailto:${email}`}
                className='break-all border-b border-ed-navy pb-0.5 font-sans-ed text-ed-navy no-underline hover:border-ed-red hover:text-ed-red'
              >
                {email}
              </a>
            </div>
          )}
        </dl>
      )}

      {children && <div className='mt-6 max-md:mt-4'>{children}</div>}
    </Container>
  </section>
);

export default DetailHeader;
