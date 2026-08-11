import { ArrowRightIcon, ExternalLinkIcon, MailIcon } from 'lucide-react';
import { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ENTRY_POINTS,
  EntryPoint,
  EntryPointAction,
  INTRO,
  linkKind,
} from './entryPoints';

/**
 * What each entry point costs the reader, in the only unit that never goes
 * stale: their time.
 */
const COMMITMENT_LABEL: Record<EntryPoint['commitment'], string> = {
  1: 'Minutes',
  2: 'Minutes',
  3: 'An hour',
  4: 'An evening',
  5: 'Ongoing',
};

/**
 * A single destination. The row cannot be one big link: rows with a second
 * channel would need a link nested inside a link, which is invalid HTML.
 * The cost is that the whole row is no longer a single tap target.
 */
const Action: FC<EntryPointAction & { primary?: boolean }> = ({
  action,
  href,
  primary = false,
}) => {
  const kind = linkKind(href);

  const className = primary
    ? 'group inline-flex items-center gap-1.5 text-primary-600 font-semibold hover:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-xs transition-all'
    : 'inline-flex items-center text-sm text-gray-500 hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-xs underline underline-offset-2';

  const Icon =
    kind === 'external'
      ? ExternalLinkIcon
      : kind === 'email'
        ? MailIcon
        : ArrowRightIcon;

  const icon = primary && <Icon className='h-4 w-4' aria-hidden='true' />;

  if (kind === 'internal') {
    return (
      <Link to={href} className={className}>
        {action}
        {icon}
      </Link>
    );
  }

  // mailto: hands off to a mail client, so a new tab would leave a blank one behind.
  const newTab = kind === 'external';

  return (
    <a
      href={href}
      className={className}
      {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {action}
      {/* The whole page is a list of links, half of them off-site. The icon
          only rides on the primary action, so the warning has to be spoken. */}
      {newTab && <span className='sr-only'> (opens in a new tab)</span>}
      {icon}
    </a>
  );
};

const Row: FC<{ entry: EntryPoint }> = ({ entry }) => (
  <li className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all'>
    <div className='flex-1'>
      <div className='flex items-center gap-2 mb-1'>
        <h3 className='text-xs font-semibold uppercase tracking-wide text-primary-600'>
          {entry.modeLabel}
        </h3>
        <span className='text-xs text-gray-400'>
          · {COMMITMENT_LABEL[entry.commitment]}
        </span>
      </div>
      <p className='text-gray-900 font-medium leading-snug'>{entry.who}</p>
      {entry.note && <p className='text-sm text-gray-500 mt-1'>{entry.note}</p>}
    </div>

    <div className='shrink-0 flex flex-col sm:items-end gap-1'>
      <Action action={entry.action} href={entry.href} primary />
      {entry.alt && <Action action={entry.alt.action} href={entry.alt.href} />}
    </div>
  </li>
);

export const ContributeRouter: FC = () => (
  <div className='container mx-auto px-4 max-w-4xl'>
    <div className='mb-8'>
      <p className='text-sm font-bold uppercase tracking-wider text-primary-600 mb-2'>
        {INTRO.eyebrow}
      </p>
      <h2
        id='ways-to-help-heading'
        className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'
      >
        {INTRO.heading}
      </h2>
      <p className='text-lg text-gray-600 max-w-2xl'>{INTRO.standfirst}</p>
    </div>

    <ul
      aria-label='Ways to contribute'
      className='flex flex-col gap-3 list-none p-0 m-0'
    >
      {ENTRY_POINTS.map(entry => (
        <Row key={entry.id} entry={entry} />
      ))}
    </ul>

    <p className='text-sm text-gray-500 mt-8'>
      Not sure which one fits? Ask in the{' '}
      <Link to='/discord' className='text-primary-600 underline'>
        Discord
      </Link>
      .
    </p>
  </div>
);
