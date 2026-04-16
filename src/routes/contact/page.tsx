import {
  MailIcon,
  MessageCircleIcon,
  UsersIcon,
  GlobeIcon,
  ArrowRightIcon,
  HeartHandshakeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react';
import { FC, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const ContactUs: FC = () => {
  const contactMethods = [
    {
      icon: <MailIcon className='h-8 w-8' />,
      title: 'Email Us',
      description:
        'Send us an email for general inquiries and collaboration opportunities',
      contact: 'volunteers@bettergov.ph',
      action: 'mailto:volunteers@bettergov.ph',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <MessageCircleIcon className='h-8 w-8' />,
      title: 'Discord Community',
      description:
        'Join our volunteer community for real-time discussions and support',
      contact: 'discord.gg/bettergov',
      action: 'https://discord.gg/mHtThpN8bT',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <UsersIcon className='h-8 w-8' />,
      title: 'Volunteer With Us',
      description: 'Help us build better digital services for Filipinos',
      contact: 'Become a Volunteer',
      action: '/join-us',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <GlobeIcon className='h-8 w-8' />,
      title: 'Report Issues',
      description: 'Found a bug or have a suggestion? Open an issue on GitHub',
      contact: 'GitHub Issues',
      action: 'https://github.com/bettergovph/bettergov/issues',
      color: 'bg-blue-100 text-blue-600',
    },
  ];

  const faqs = [
    {
      question: 'How can I volunteer for BetterGov?',
      answer:
        'We welcome volunteers with various skills! Check out our Join Us page to see current opportunities and fill out our volunteer form.',
      link: { text: 'Join Us page', href: '/join-us' },
    },
    {
      question: 'Is BetterGov affiliated with the Philippine government?',
      answer:
        'No, BetterGov is an independent volunteer-led initiative. We work alongside government agencies but are not officially part of the Philippine government.',
    },
    {
      question: 'How do I report a bug or request a feature?',
      answer:
        'The best way is to open an issue on our GitHub repository. This helps us track and prioritize all requests.',
      link: {
        text: 'GitHub repository',
        href: 'https://github.com/bettergovph/bettergov/issues',
      },
    },
    {
      question: 'Can I use BetterGov content for my project?',
      answer:
        'Yes! BetterGov is released under Creative Commons CC0, meaning our content is in the public domain and can be used freely for any purpose.',
    },
    {
      question: 'Where does the data on BetterGov come from?',
      answer:
        'Our data is aggregated from various publicly available government sources. We use custom scripts and tools to collect, process, and display this information in a way that is easy for citizens to access and understand.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Contact Us | BetterGov.ph</title>
        <meta
          name='description'
          content='Contact the BetterGov.ph team. Get in touch with our volunteers, report issues, or join our community.'
        />
        <meta
          name='keywords'
          content='contact, bettergov, volunteer, feedback, support, philippines government'
        />
        <link rel='canonical' href='https://bettergov.ph/contact' />
        <meta property='og:title' content='Contact Us | BetterGov.ph' />
        <meta
          property='og:description'
          content='Contact the BetterGov.ph team. Get in touch with our volunteers, report issues, or join our community.'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bettergov.ph/contact' />
        <meta property='og:image' content='https://bettergov.ph/ph-logo.png' />
      </Helmet>

      <div className='container mx-auto px-4 py-6 md:py-8'>
        {/* Header Section */}
        <div className='bg-white rounded-lg border shadow-xs p-6 md:p-8 md:py-16 mt-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='flex justify-center mb-6'>
              <div className='p-4 bg-blue-100 rounded-full'>
                <HeartHandshakeIcon className='h-12 w-12 text-blue-600' />
              </div>
            </div>
            <h1 className='text-3xl md:text-5xl font-bold text-gray-900 mb-6'>
              Connect with Us
            </h1>
            <p className='text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8'>
              We&apos;re a passionate community of volunteers, developers, and
              designers dedicated to improving digital public services in the
              Philippines. Whether you have a question, a suggestion, or want to
              join our mission, we&apos;d love to hear from you.
            </p>
          </div>
        </div>

        {/* Contact Methods Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8'>
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className='bg-white rounded-lg border shadow-xs hover:shadow-md transition-shadow p-6'
            >
              <div className={`${method.color} rounded-lg p-3 w-fit mb-4`}>
                {method.icon}
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                {method.title}
              </h3>
              <p className='text-gray-600 text-sm mb-4'>{method.description}</p>
              <a
                href={method.action}
                className='text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center group'
                target={method.action.startsWith('http') ? '_blank' : '_self'}
                rel={
                  method.action.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
              >
                {method.contact}
                <ArrowRightIcon className='w-4 h-4 ml-1 transition-transform group-hover:translate-x-1' />
              </a>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='bg-white rounded-lg border shadow-xs p-6 md:p-8 mt-8'>
          <div className='max-w-4xl mx-auto'>
            <div className='text-center mb-8'>
              <h2 className='text-2xl md:text-3xl font-bold text-gray-900 mb-4'>
                Frequently Asked Questions
              </h2>
              <p className='text-gray-600'>
                Find answers to common questions about BetterGov
              </p>
            </div>

            <div className='space-y-4'>
              {faqs.map((faq, index) => (
                <div key={index} className='border rounded-lg'>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className='w-full flex justify-between items-center p-4 text-left'
                  >
                    <h3 className='font-semibold text-gray-800 flex-1'>
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUpIcon className='h-5 w-5 text-gray-500' />
                    ) : (
                      <ChevronDownIcon className='h-5 w-5 text-gray-500' />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className='p-4 pt-0 text-gray-600 text-sm leading-relaxed'>
                      <p>
                        {faq.answer}
                        {faq.link && (
                          <>
                            {' '}
                            <Link
                              to={faq.link.href}
                              className='text-blue-600 hover:text-blue-800 font-medium'
                              target={
                                faq.link.href.startsWith('http')
                                  ? '_blank'
                                  : '_self'
                              }
                              rel={
                                faq.link.href.startsWith('http')
                                  ? 'noopener noreferrer'
                                  : undefined
                              }
                            >
                              {faq.link.text}
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mt-8 text-center'>
          <h3 className='text-2xl font-bold text-white mb-4'>
            Ready to Make a Difference?
          </h3>
          <p className='text-blue-100 mb-6 max-w-2xl mx-auto'>
            Join our community of volunteers building better digital services
            for the Philippines.
          </p>
          <Link
            to='/join-us'
            className='inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors'
          >
            Become a Volunteer
            <ArrowRightIcon className='w-5 h-5 ml-2' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
