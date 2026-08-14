import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import PageMasthead from '../components/v2/layout/PageMasthead';
import Container from '../components/v2/ui/Container';
import Button from '../components/v2/ui/Button';

const DISCORD_URL = 'https://discord.gg/bettergovph';

export default function Discord() {
  useEffect(() => {
    window.location.assign(DISCORD_URL);
  }, []);

  return (
    <main className='min-h-screen bg-white font-sans-ed text-ed-ink antialiased'>
      <Helmet>
        <title>Join our Discord | BetterGov.ph</title>
        <meta
          name='description'
          content='Join the BetterGov.ph community on Discord — volunteer contributors, civic tech enthusiasts, and government transparency advocates.'
        />
      </Helmet>

      <PageMasthead
        title='Join us on Discord'
        lede='Connect with volunteer contributors and civic tech enthusiasts building a better government portal for the Philippines.'
      />

      <section className='py-12 max-md:py-8'>
        <Container narrow>
          <p className='font-sans-ed text-[17px] leading-relaxed text-ed-ink-2 max-w-xl mb-8'>
            You should be redirected automatically. If not, click the button
            below to open the BetterGov.ph Discord server.
          </p>
          <Button as='a' href={DISCORD_URL} variant='solid'>
            Open Discord
          </Button>
        </Container>
      </section>
    </main>
  );
}
