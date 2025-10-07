import {
  ArrowRightIcon,
  BuildingIcon,
  CodeIcon,
  GlobeIcon,
  HeartIcon,
  LightbulbIcon,
  MessageCircleIcon,
  RocketIcon,
  ServerIcon,
  StarIcon,
  TargetIcon,
  UsersIcon,
  ZapIcon,
} from 'lucide-react';
import { FC } from 'react';
import { Helmet } from 'react-helmet-async';

const JoinUs: FC = () => {
  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50'>
      <Helmet>
        <title>Join Us | BetterGov.ph</title>
        <meta
          name='description'
          content='Join BetterGov.ph—A volunteer-led civic tech initiative building open-source tools to make government more transparent, efficient, and accessible.'
        />
        <link rel='canonical' href='https://bettergov.ph/join-us' />
        <meta property='og:title' content='Join Us | BetterGov.ph' />
        <meta
          property='og:description'
          content='Be part of a volunteer-led civic tech initiative building open-source projects for a better government.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bettergov.ph/join-us' />
        <meta property='og:image' content='https://bettergov.ph/ph-logo.webp' />
      </Helmet>

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-linear-to-r from-primary-600 via-blue-700 to-purple-700 text-white'>
        <div className='absolute inset-0 bg-black opacity-10'></div>
        <div className='relative container mx-auto px-4 py-16 md:py-24 z-10'>
          <div className='text-center max-w-4xl mx-auto'>
            <div className='flex justify-center mb-6'>
              <div className='p-4 bg-white/20 rounded-full backdrop-blur-sm'>
                <UsersIcon className='h-12 w-12 text-white' />
              </div>
            </div>
            <h1 className='text-4xl md:text-6xl font-bold mb-6 leading-tight'>
              Join the <span className='text-yellow-300'>#CivicTech</span>{' '}
              Revolution
            </h1>
            <p className='text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed'>
              Together with industry veterans, we&apos;re building{' '}
              <strong>BetterGov.ph</strong> — making government transparent,
              efficient, and accessible to every Filipino.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <a
                href='https://discord.gg/mHtThpN8bT'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center justify-center px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg'
              >
                <MessageCircleIcon className='h-5 w-5 mr-2' />
                Join Our Discord
              </a>
              <a
                href='#mission'
                className='inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-all'
              >
                Learn More
                <ArrowRightIcon className='h-5 w-5 ml-2' />
              </a>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className='absolute top-20 left-10 opacity-20'>
          <CodeIcon className='h-24 w-24 text-white' />
        </div>
        <div className='absolute bottom-20 right-10 opacity-20'>
          <RocketIcon className='h-32 w-32 text-white' />
        </div>
      </section>

      {/* Mission Section */}
      <section id='mission' className='py-16 md:py-20 bg-white'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <div className='inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4'>
              <TargetIcon className='h-8 w-8 text-primary-600' />
            </div>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Our Mission
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              We&apos;re not just building websites — we&apos;re building the
              future of governance in the Philippines.
            </p>
          </div>

          <div className='max-w-4xl mx-auto'>
            <div className='bg-linear-to-r from-primary-50 to-blue-50 rounded-2xl p-8 md:p-12 mb-8'>
              <p className='text-lg text-gray-800 leading-relaxed mb-6'>
                BetterGov is a <strong>volunteer-led tech initiative</strong>{' '}
                committed to creating
                <span className='inline-flex items-center mx-2 px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-semibold'>
                  <ZapIcon className='h-4 w-4 mr-1' />
                  #civictech
                </span>
                projects aimed at making government more transparent, efficient,
                and accessible to citizens.
              </p>
              <p className='text-lg text-gray-800 leading-relaxed'>
                We&apos;ve seen a surge of wonderful and impressive tech ideas
                being launched recently. Our goal is to{' '}
                <strong>support, promote, consolidate, and empower</strong>{' '}
                these builders!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide Section */}
      <section className='py-16 md:py-20 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              What We Provide
            </h2>
            <p className='text-xl text-gray-600'>
              Everything you need to build impactful civic tech projects
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
            {[
              {
                icon: ServerIcon,
                title: 'Infrastructure & Tools',
                desc: 'Servers, AI credits, development tools, and more!',
              },
              {
                icon: UsersIcon,
                title: 'Tech Hackathons',
                desc: 'Regular events to collaborate and build together',
              },
              {
                icon: GlobeIcon,
                title: 'Data & APIs',
                desc: 'Access to government data and API endpoints',
              },
              {
                icon: HeartIcon,
                title: 'Find Your Team',
                desc: 'Connect with the right people and resource persons',
              },
              {
                icon: StarIcon,
                title: 'Industry Mentorship',
                desc: 'Guidance from seasoned tech and startup veterans',
              },
              {
                icon: BuildingIcon,
                title: 'Office Space',
                desc: 'Physical workspace for collaboration and meetings',
              },
            ].map((item, index) => (
              <div
                key={index}
                className='bg-white rounded-xl p-6 shadow-xs hover:shadow-md transition-all transform hover:-translate-y-1'
              >
                <div className='flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4'>
                  <item.icon className='h-6 w-6 text-primary-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {item.title}
                </h3>
                <p className='text-gray-600'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Message Section */}
      <section className='py-16 md:py-20 bg-linear-to-r from-red-900 via-gray-900 to-purple-900 text-white relative overflow-hidden'>
        <div className='absolute inset-0 bg-black/30'></div>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='max-w-5xl mx-auto text-center'>
            <div className='flex justify-center mb-8'>
              <div className='p-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-2xl'>
                <ZapIcon className='h-12 w-12 text-gray-900' />
              </div>
            </div>
            <h2 className='text-4xl md:text-6xl font-black mb-12 text-transparent bg-clip-text bg-linear-to-r from-yellow-300 via-orange-300 to-red-300'>
              WE&apos;RE DONE WAITING
            </h2>
            <div className='bg-linear-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-3xl p-10 md:p-16 border border-white/20 shadow-2xl'>
              <blockquote className='text-xl md:text-3xl font-bold leading-relaxed space-y-8 text-center'>
                <p className='text-yellow-300 text-2xl md:text-4xl font-black uppercase tracking-wider'>
                  &ldquo;WE&apos;RE ANGRY. YOU&apos;RE ANGRY.&rdquo;
                </p>
                <p className='text-white text-xl md:text-2xl'>
                  But we can contribute in our own ways —{' '}
                  <strong className='text-yellow-300'>
                    NO MATTER HOW LITTLE IT IS.
                  </strong>
                </p>
                <p className='text-white text-xl md:text-2xl'>
                  We can do{' '}
                  <span className='text-transparent bg-clip-text bg-linear-to-r from-yellow-300 to-orange-300 font-black text-2xl md:text-3xl'>
                    AMAZING THINGS
                  </span>{' '}
                  together.
                </p>
                <p className='text-orange-300 text-xl md:text-2xl font-black uppercase'>
                  GRASSROOTS STYLE. OPEN SOURCE. NO PERMISSION NEEDED.
                </p>
                <p className='text-white text-lg md:text-xl'>
                  We are committed to putting{' '}
                  <strong>TIME, RESOURCES, AND MONEY</strong> into this
                  initiative.
                </p>
                <p className='text-white text-lg md:text-xl'>
                  We will keep building{' '}
                  <strong className='text-yellow-300'>RELENTLESSLY</strong>{' '}
                  without anyone&apos;s permission. Open source, public,{' '}
                  <strong>HIGH QUALITY</strong> sites.
                </p>
              </blockquote>
              <div className='mt-12 pt-8 border-t-2 border-gradient-to-r from-yellow-300 to-orange-300'>
                <p className='text-yellow-300 font-black text-xl md:text-2xl uppercase tracking-wide'>
                  WE&apos;RE LOOKING FOR PEOPLE SMARTER THAN US!
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className='absolute top-10 left-10 opacity-10'>
          <RocketIcon className='h-32 w-32 text-yellow-400 transform rotate-45' />
        </div>
        <div className='absolute bottom-10 right-10 opacity-10'>
          <CodeIcon className='h-40 w-40 text-orange-400 transform -rotate-12' />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className='py-16 md:py-20 bg-linear-to-r from-primary-600 to-blue-600'>
        <div className='container mx-auto px-4 text-center'>
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
              Ready to Make a Difference?
            </h2>
            <p className='text-xl text-blue-100 mb-8'>
              Join our community of builders, dreamers, and changemakers.
              Together, we&apos;ll create the government technology the
              Philippines deserves.
            </p>

            <div className='flex flex-col sm:flex-row gap-6 justify-center items-center'>
              <a
                href='https://discord.gg/mHtThpN8bT'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center justify-center px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg text-lg'
              >
                <MessageCircleIcon className='h-6 w-6 mr-3' />
                Join Our Discord Community
              </a>

              <div className='text-white font-medium'>or</div>

              <a
                href='https://bettergov.ph/ideas'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-all'
              >
                <LightbulbIcon className='h-5 w-5 mr-2' />
                Explore Project Ideas
              </a>
            </div>

            <div className='mt-8 pt-6 border-t border-white/20'>
              <p className='text-blue-100 text-sm'>
                Open source • Community-driven • Built with ❤️ for the
                Philippines
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JoinUs;
