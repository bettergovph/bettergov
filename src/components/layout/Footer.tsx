import {
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiX,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { footerNavigation } from '../../data/navigation';
import versionData from '../../version.json';
import Modal from '../ui/Modal';

type Version = {
  head_commit: string;
};

const Footer: FC = () => {
  const { t } = useTranslation('common');
  const [version, setVersion] = useState<string | null>(null);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  useEffect(() => {
    try {
      const version = versionData as Version;
      if (version?.head_commit) {
        setVersion(version.head_commit.substring(0, 6)); // only first 6 chars
      }
    } catch (err) {
      console.error('Error loading version.json:', err);
    }
  }, []);

  const getSocialIcon = (label: string) => {
    switch (label) {
      case 'Facebook':
        return <SiFacebook className='h-5 w-5' />;
      case 'Twitter':
        return <SiX className='h-5 w-5' />;
      case 'Instagram':
        return <SiInstagram className='h-5 w-5' />;
      case 'YouTube':
        return <SiYoutube className='h-5 w-5' />;
      case 'Discord':
        return <SiDiscord className='h-5 w-5' />;
      default:
        return null;
    }
  };

  return (
    <footer className='bg-gray-900 text-white'>
      <div className='container mx-auto px-4 pt-12 pb-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8'>
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center mb-4'>
              <img
                src='/logos/svg/BetterGov_Icon-White.svg'
                alt='BetterGov Logo'
                className='h-12 w-12 mr-3'
              />

              <div>
                <div className='font-bold'>Better Philippines</div>
                <div className='text-xs text-gray-400'>BetterGov.ph Portal</div>
              </div>
            </div>
            <p className='text-gray-400 text-sm mb-4'>
              A community portal providing Philippine citizens, businesses, and
              visitors with information and services.
            </p>
            <div className='flex space-x-4'>
              {footerNavigation.socialLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  className='text-gray-400 hover:text-white transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {getSocialIcon(link.label)}
                </Link>
              ))}
            </div>
          </div>

          {footerNavigation.mainSections.map(section => (
            <div key={section.title}>
              <h3 className='text-lg font-semibold mb-4'>{section.title}</h3>
              <ul className='space-y-2'>
                {section.links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className='text-gray-400 hover:text-white text-sm transition-colors'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className='flex flex-col items-center justify-center gap-6 my-24 md:flex-row'>
          <p className='text-white text-sm md:text-lg bg-gray-800 p-4 px-12 md:px-8 rounded-full border border-gray-700 text-center'>
            Cost to build this site to date:{' '}
            <span className='animate-pulse text-red-500'>₱3,000</span>. Cost to
            the People of the Philippines:{' '}
            <span className='text-green-500'>₱0</span>.
          </p>
          <button
            type='button'
            onClick={() => setIsDonateOpen(true)}
            className='inline-flex cursor-pointer items-center justify-center rounded-full border border-primary-500 bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-600 focus:outline-hidden focus:ring-2 focus:ring-primary-500/30'
          >
            Donate via BetterGov Merch
          </button>
        </div>

        <div className='border-t border-gray-800 mt-8 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-400 text-sm mb-4 md:mb-0'>
              {version && (
                <span className='mr-4 text-gray-400'>Ver. {version}</span>
              )}
              {t('footer.copyright')}
            </p>
            <div className='flex space-x-6'>
              <Link
                to='https://github.com/bettergovph/bettergov'
                className='text-gray-400 hover:text-white text-sm transition-colors'
              >
                Contribute at GitHub
              </Link>
              <Link
                to='/sitemap'
                className='text-gray-400 hover:text-white text-sm transition-colors'
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        title='Support Our Monthly Server Costs'
        description='Grab limited BetterGov merchandise and every purchase keeps our infrastructure running for Filipinos.'
        size='lg'
        footer={
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <span className='text-sm text-gray-500'>
              Limited drops every month. Reserve yours now.
            </span>
            <a
              href='#'
              rel='noopener noreferrer'
              className='inline-flex items-center justify-center rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 focus:outline-hidden focus:ring-2 focus:ring-primary-500/30'
            >
              Fill out the order form
            </a>
          </div>
        }
      >
        <div className='space-y-6'>
          <img
            src='https://placeimg.dev/960x540/4F46E5?text=placeholder'
            alt='BetterGov merch preview'
            className='w-full rounded-xl object-cover'
          />
          <div className='space-y-3 text-sm text-gray-600'>
            <p>
              Every peso goes straight to covering our monthly hosting,
              security, and uptime monitoring. In return, you get exclusive
              BetterGov gear made for civic hackers and public service
              advocates.
            </p>
            <p>
              Choose from tees, stickers, and desk gear bundles—each designed
              with the Better Philippines spirit. Once you submit the form,
              we&rsquo;ll reach out with payment and delivery details.
            </p>
          </div>
        </div>
      </Modal>
    </footer>
  );
};

export default Footer;
