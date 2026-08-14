import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import PageMasthead from '../components/v2/layout/PageMasthead';
import Container from '../components/v2/ui/Container';
import SectionHeader from '../components/v2/ui/SectionHeader';
import Dropcap from '../components/v2/ui/Dropcap';
import ArrowLink from '../components/v2/ui/ArrowLink';

const TermsOfService: FC = () => (
  <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
    <Helmet>
      <title>Terms of Service | BetterGov.ph</title>
      <meta
        name='description'
        content='Terms of Service for BetterGov.ph — public domain content, volunteer operation, and user responsibilities.'
      />
      <link rel='canonical' href='https://bettergov.ph/terms-of-service' />
      <meta property='og:title' content='Terms of Service | BetterGov.ph' />
      <meta
        property='og:description'
        content='Terms of Service for BetterGov.ph — public domain content and volunteer operation guidelines.'
      />
      <meta property='og:type' content='website' />
      <meta property='og:url' content='https://bettergov.ph/terms-of-service' />
    </Helmet>

    <PageMasthead
      title='Terms of Service'
      lede='Effective September 23, 2025'
    />

    <section className='py-12 max-md:py-8'>
      <Container narrow>
        <SectionHeader label='Acceptance of Terms' />
        <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
          <Dropcap>
            By accessing and using this website, you accept and agree to be
            bound by the terms and provisions of this agreement. If you do not
            agree to these terms, please discontinue use of the site.
          </Dropcap>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Public Domain Content & Volunteer Operation' />
          <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              This website and all its content are in the public domain and
              operated entirely by volunteers. All information, data, documents,
              and materials provided on this website are in the public domain
              unless otherwise noted.
            </p>
            <p>
              Public domain content may be freely used, copied, distributed, and
              modified without permission or attribution, though attribution is
              appreciated. As a volunteer-operated resource, we encourage users
              to conduct their own independent research and verification of
              information.
            </p>
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='&ldquo;As Is&rdquo; Disclaimer' />
          <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              All information on this website is provided &ldquo;as is&rdquo;
              without warranty of any kind, either express or implied, including
              but not limited to warranties of merchantability, fitness for a
              particular purpose, or accuracy and completeness of information.
            </p>
          </div>
          <div className='mt-6 max-w-2xl border-l-2 border-ed-navy pl-5 space-y-1'>
            {[
              'Warranties of merchantability',
              'Fitness for a particular purpose',
              'Non-infringement of intellectual property rights',
              'Accuracy, completeness, or reliability of information',
              'Freedom from errors, viruses, or other harmful components',
            ].map(item => (
              <p
                key={item}
                className='flex items-start gap-2 text-sm text-ed-ink-2'
              >
                <span className='mt-1.5 h-1 w-1 rounded-full bg-ed-navy shrink-0' />
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Limitation of Liability' />
          <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              Under no circumstances shall the website operators, contributors,
              or affiliated parties be liable for any direct, indirect,
              incidental, special, consequential, or punitive damages arising
              from your use of this website, any errors or omissions in the
              content, any interruption or cessation of transmission, any bugs
              or harmful components, or loss of data.
            </p>
            <p>
              This limitation applies regardless of whether such damages arise
              from contract, tort, negligence, strict liability, or any other
              legal theory.
            </p>
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='User Responsibilities' />
          <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              Users are solely responsible for conducting their own independent
              verification of all information obtained from this website,
              reviewing original source links provided, and determining the
              suitability of information for their intended use.
            </p>
            <p>
              We strongly encourage consulting official government websites and
              agencies for the most current information, and verifying dates,
              figures, and details through multiple reputable sources.
            </p>
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='No Professional Advice' />
          <div className='max-w-2xl font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              Information on this website is not intended as professional advice
              — legal, medical, financial, or otherwise. Users should consult
              qualified professionals for specific advice related to their
              situations.
            </p>
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Governing Law' />
          <div className='max-w-2xl font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              These terms are governed by the laws of the Republic of the
              Philippines without regard to conflict of law principles. If any
              provision is found to be unenforceable, the remaining provisions
              will continue in full force and effect.
            </p>
          </div>
        </div>

        <div className='mt-14'>
          <SectionHeader label='Content Concerns & Takedown Requests' />
          <div className='max-w-2xl space-y-5 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2'>
            <p>
              While we strive to provide accurate public domain information, we
              recognise that errors, outdated information, or other concerns may
              arise. To report content you believe is factually incorrect,
              potentially harmful, or in violation of applicable laws, contact
              us at the address below with the specific URL, a clear description
              of the concern, and supporting documentation where applicable.
            </p>
            <p>
              We will review all legitimate concerns in good faith. Response
              time may vary due to our volunteer nature.
            </p>
          </div>
          <div className='mt-6 flex flex-col gap-3'>
            <ArrowLink to='mailto:volunteers@bettergov.ph' external>
              volunteers@bettergov.ph
            </ArrowLink>
          </div>
        </div>

        <p className='mt-16 border-t border-ed-rule pt-5 font-mono-ed text-[11px] text-ed-ink-4'>
          Effective as of September 23, 2025. These terms may be modified at any
          time without notice; continued use constitutes acceptance.
        </p>
      </Container>
    </section>
  </main>
);

export default TermsOfService;
