import { FC } from 'react';
import {
  AccessibilityIcon,
  FileTextIcon,
  GithubIcon,
  PhoneCallIcon,
  PhoneIcon,
  type LucideIcon,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Container from '../components/v2/ui/Container';
import PageMasthead from '../components/v2/layout/PageMasthead';
import SectionHeader from '../components/v2/ui/SectionHeader';
import ArrowLink from '../components/v2/ui/ArrowLink';
import { ABOUT_URL, ISSUES_URL, SITE_NAME, SITE_URL } from '../lib/brand';

const DESCRIPTION =
  'Official channels for reaching the Philippine government: the 8888 Citizens’ Complaint Hotline, emergency numbers, Freedom of Information, and feedback for this website.';

interface Channel {
  icon: LucideIcon;
  label: string;
  title: string;
  href: string;
  external?: boolean;
  blurb: string;
}

const GOVERNMENT_CHANNELS: Channel[] = [
  {
    icon: PhoneIcon,
    label: 'Complaints and inquiries',
    title: 'Contact Center ng Bayan · 8888',
    href: 'https://contactcenterngbayan.gov.ph',
    external: true,
    blurb:
      'The national hotline for complaints, requests, and questions about any government agency, office, or service. Dial 8888 from any phone, or file online.',
  },
  {
    icon: PhoneCallIcon,
    label: 'Emergencies',
    title: 'Emergency hotline · 911',
    href: '/philippines/hotlines',
    blurb:
      'For police, fire, and medical emergencies dial 911. Disaster, health, and agency-specific numbers are listed on the hotlines page.',
  },
  {
    icon: FileTextIcon,
    label: 'Freedom of Information',
    title: 'eFOI portal',
    href: 'https://www.foi.gov.ph',
    external: true,
    blurb:
      'Request records and documents from national government agencies under the Freedom of Information programme.',
  },
];

const WEBSITE_CHANNELS: Channel[] = [
  {
    icon: GithubIcon,
    label: 'Website feedback',
    title: 'Report a problem with this site',
    href: ISSUES_URL,
    external: true,
    blurb:
      'Found a broken link, outdated information, or a bug? Open an issue and the portal team will review it against the official source.',
  },
  {
    icon: AccessibilityIcon,
    label: 'Accessibility',
    title: 'Accessibility statement',
    href: '/accessibility',
    blurb:
      'How this site supports assistive technology, and how to tell us about a barrier you encountered.',
  },
];

const ChannelCard: FC<{ channel: Channel }> = ({ channel }) => {
  const Icon = channel.icon;
  const inner = (
    <>
      <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-0.5'>
        {channel.label}
      </div>
      <span className='font-sans-ed text-sm font-medium text-ed-navy group-hover:underline'>
        {channel.title}
      </span>
      <p className='mt-1 text-[12px] text-ed-ink-3 leading-normal'>
        {channel.blurb}
      </p>
    </>
  );

  return (
    <div className='flex gap-4 p-5'>
      <div className='mt-0.5 shrink-0 text-ed-navy'>
        <Icon size={18} />
      </div>
      <div className='group min-w-0'>
        {channel.external ? (
          <a
            href={channel.href}
            target='_blank'
            rel='noopener noreferrer'
            className='block no-underline'
          >
            {inner}
          </a>
        ) : (
          <Link to={channel.href} className='block no-underline'>
            {inner}
          </Link>
        )}
      </div>
    </div>
  );
};

const ContactUs: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Contact | {SITE_NAME}</title>
      <meta name='description' content={DESCRIPTION} />
      <meta
        name='keywords'
        content='contact, 8888, hotline, complaint, freedom of information, feedback, philippines government'
      />
      <link rel='canonical' href={`${SITE_URL}/contact`} />
      <meta property='og:title' content={`Contact | ${SITE_NAME}`} />
      <meta property='og:description' content={DESCRIPTION} />
      <meta property='og:type' content='website' />
      <meta property='og:url' content={`${SITE_URL}/contact`} />
      <meta property='og:image' content={`${SITE_URL}/og-image.png`} />
    </Helmet>

    <PageMasthead
      variant='light'
      title='Get in touch'
      lede='Reach the right office for your concern. These are the official channels for government inquiries and for feedback about this website.'
    />

    <section className='py-14 max-md:py-6'>
      <Container>
        <div className='grid grid-cols-[1fr_1fr] gap-16 max-lg:grid-cols-1 max-lg:gap-10'>
          <div>
            <SectionHeader label='Government services and concerns' />
            <div className='divide-y divide-ed-rule border border-ed-rule'>
              {GOVERNMENT_CHANNELS.map(channel => (
                <ChannelCard key={channel.title} channel={channel} />
              ))}
            </div>
            <p className='mt-4 text-[13px] leading-relaxed text-ed-ink-3'>
              For a specific agency, the{' '}
              <Link to='/government/departments' className='text-ed-navy'>
                departments directory
              </Link>{' '}
              lists official addresses, trunk lines, and websites.
            </p>
          </div>

          <div className='max-lg:border-t max-lg:border-ed-rule max-lg:pt-10'>
            <SectionHeader label='About this website' />
            <div className='divide-y divide-ed-rule border border-ed-rule'>
              {WEBSITE_CHANNELS.map(channel => (
                <ChannelCard key={channel.title} channel={channel} />
              ))}
            </div>

            <div className='mt-6 border border-ed-rule bg-ed-paper-2 p-5'>
              <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-2'>
                Open source
              </div>
              <p className='font-sans-ed text-[17px] leading-snug text-ed-ink-2'>
                This portal is built in the open. Corrections and improvements
                are welcome as pull requests.
              </p>
              <ArrowLink to={ABOUT_URL} external className='mt-3'>
                Learn more about BetterGov
              </ArrowLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  </main>
);

export default ContactUs;
