import { FC, FormEvent, useState } from 'react';
import {
  GithubIcon,
  MailIcon,
  MessageCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../components/v2/ui/Container';
import Eyebrow from '../components/v2/ui/Eyebrow';
import Button from '../components/v2/ui/Button';
import PageMasthead from '../components/v2/layout/PageMasthead';

const ContactUs: FC = () => {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <PageMasthead
        variant='light'
        eyebrow='Contact · BetterGov.PH'
        title='Get in touch'
        lede="We're a volunteer-led initiative. Reach us through any of the channels below, or drop us a message and we'll get back to you."
      />

      <section className='py-14 max-md:py-8'>
        <Container>
          <div className='grid grid-cols-[1fr_380px] gap-16 max-lg:grid-cols-1 max-lg:gap-10'>
            {/* Left: contact form */}
            <div>
              <div className='mb-6 border-t-2 border-ed-navy pt-5'>
                <Eyebrow tone='navy'>Send us a message</Eyebrow>
              </div>

              {sent ? (
                <div className='border border-ed-rule bg-ed-paper-2 p-8'>
                  <p className='font-serif-ed text-[22px] font-medium text-ed-navy-ink'>
                    Message received.
                  </p>
                  <p className='mt-2 text-sm text-ed-ink-2'>
                    Thank you for reaching out. We&apos;ll respond within a few
                    business days.
                  </p>
                  <button
                    className='mt-4 text-[13px] font-medium text-ed-navy underline'
                    onClick={() => {
                      setSent(false);
                      setForm({
                        name: '',
                        email: '',
                        subject: '',
                        message: '',
                      });
                    }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-2 gap-6 max-sm:grid-cols-1'>
                    <div>
                      <label
                        className='block font-serif-ed text-[15px] font-medium text-ed-ink mb-1.5'
                        htmlFor='name'
                      >
                        Your name
                      </label>
                      <input
                        id='name'
                        name='name'
                        type='text'
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder='Juan dela Cruz'
                        className='w-full border border-ed-rule bg-white px-3 py-2.5 font-sans-ed text-sm text-ed-ink placeholder:text-ed-ink-4 focus:border-ed-ink focus:outline-none'
                      />
                    </div>
                    <div>
                      <label
                        className='block font-serif-ed text-[15px] font-medium text-ed-ink mb-1.5'
                        htmlFor='email'
                      >
                        Email address
                      </label>
                      <input
                        id='email'
                        name='email'
                        type='email'
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder='you@example.com'
                        className='w-full border border-ed-rule bg-white px-3 py-2.5 font-sans-ed text-sm text-ed-ink placeholder:text-ed-ink-4 focus:border-ed-ink focus:outline-none'
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className='block font-serif-ed text-[15px] font-medium text-ed-ink mb-1.5'
                      htmlFor='subject'
                    >
                      Subject
                    </label>
                    <select
                      id='subject'
                      name='subject'
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className='w-full border border-ed-rule bg-white px-3 py-2.5 font-sans-ed text-sm text-ed-ink focus:border-ed-ink focus:outline-none'
                    >
                      <option value=''>Select a topic…</option>
                      <option value='general'>General inquiry</option>
                      <option value='bug'>Bug report</option>
                      <option value='feature'>Feature suggestion</option>
                      <option value='data'>Data correction</option>
                      <option value='volunteer'>Volunteer inquiry</option>
                      <option value='press'>Press / media</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className='block font-serif-ed text-[15px] font-medium text-ed-ink mb-1.5'
                      htmlFor='message'
                    >
                      Message
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      placeholder='What would you like to tell us?'
                      className='w-full border border-ed-rule bg-white px-3 py-2.5 font-sans-ed text-sm text-ed-ink placeholder:text-ed-ink-4 focus:border-ed-ink focus:outline-none resize-none'
                    />
                  </div>

                  <div>
                    <Button type='submit' variant='solid' size='md'>
                      Send message
                    </Button>
                    <p className='mt-3 text-[12px] text-ed-ink-3'>
                      We typically respond within 2–4 business days. For urgent
                      matters use Discord.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Right: contact card */}
            <div className='max-lg:border-t max-lg:border-ed-rule max-lg:pt-10'>
              <div className='mb-6 border-t-2 border-ed-navy pt-5 max-lg:border-t-0 max-lg:pt-0'>
                <Eyebrow tone='navy'>Contact channels</Eyebrow>
              </div>

              <div className='space-y-0 divide-y divide-ed-rule border border-ed-rule'>
                {/* Email */}
                <div className='flex gap-4 p-5'>
                  <div className='mt-0.5 shrink-0 text-ed-navy'>
                    <MailIcon size={18} />
                  </div>
                  <div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-0.5'>
                      Email
                    </div>
                    <a
                      href='mailto:volunteers@bettergov.ph'
                      className='font-sans-ed text-sm font-medium text-ed-navy hover:underline'
                    >
                      volunteers@bettergov.ph
                    </a>
                    <p className='mt-1 text-[12px] text-ed-ink-3 leading-normal'>
                      General inquiries and collaboration
                    </p>
                  </div>
                </div>

                {/* Discord */}
                <div className='flex gap-4 p-5'>
                  <div className='mt-0.5 shrink-0 text-ed-navy'>
                    <MessageCircleIcon size={18} />
                  </div>
                  <div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-0.5'>
                      Discord
                    </div>
                    <a
                      href='https://discord.gg/mHtThpN8bT'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-sans-ed text-sm font-medium text-ed-navy hover:underline'
                    >
                      discord.gg/mHtThpN8bT
                    </a>
                    <p className='mt-1 text-[12px] text-ed-ink-3 leading-normal'>
                      Real-time community chat for volunteers
                    </p>
                  </div>
                </div>

                {/* GitHub */}
                <div className='flex gap-4 p-5'>
                  <div className='mt-0.5 shrink-0 text-ed-navy'>
                    <GithubIcon size={18} />
                  </div>
                  <div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-0.5'>
                      GitHub
                    </div>
                    <a
                      href='https://github.com/bettergovph/bettergov/issues'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-sans-ed text-sm font-medium text-ed-navy hover:underline'
                    >
                      bettergovph/bettergov
                    </a>
                    <p className='mt-1 text-[12px] text-ed-ink-3 leading-normal'>
                      Bug reports and feature requests
                    </p>
                  </div>
                </div>

                {/* Office hours */}
                <div className='flex gap-4 p-5'>
                  <div className='mt-0.5 shrink-0 text-ed-navy'>
                    <ClockIcon size={18} />
                  </div>
                  <div>
                    <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-0.5'>
                      Office hours
                    </div>
                    <p className='font-sans-ed text-sm font-medium text-ed-ink'>
                      Saturdays, 10 AM – 12 PM PHT
                    </p>
                    <p className='mt-1 text-[12px] text-ed-ink-3 leading-normal'>
                      Open community calls on Discord — all welcome
                    </p>
                  </div>
                </div>
              </div>

              {/* Volunteer CTA */}
              <div className='mt-6 border border-ed-rule bg-ed-paper-2 p-5'>
                <div className='font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3 mb-2'>
                  Get involved
                </div>
                <p className='font-serif-ed text-[17px] leading-snug text-ed-ink-2'>
                  Want to contribute code, data, or design?
                </p>
                <Link
                  to='/join-us'
                  className='mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ed-navy hover:underline'
                >
                  See open roles <ArrowRightIcon size={13} />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
};

export default ContactUs;
