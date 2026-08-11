import { SiDiscord } from '@icons-pack/react-simple-icons';
import { FC } from 'react';
import { Link } from 'react-router-dom';

const MODES = ['Join in', 'Fix data', 'Write code', 'Build your own'];

export const ContributeHero: FC = () => (
  <section className='bg-linear-to-r from-primary-600 to-primary-700 text-white'>
    {/* max-w-4xl to line the hero up with the list below it */}
    <div className='container mx-auto px-4 max-w-4xl py-12 md:py-20'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
        <div className='animate-fade-in'>
          <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight'>
            Contribute to BetterGov.ph
          </h1>
          <p className='text-lg text-blue-100 mb-6 max-w-lg'>
            Volunteer-led, open source, and always short of hands. Every current
            way in is on this page, ordered by how much it asks of you.
          </p>
          <ul className='flex flex-wrap gap-2 list-none p-0 m-0'>
            {MODES.map(mode => (
              <li
                key={mode}
                className='bg-white/10 text-white border border-white/20 py-2 px-4 rounded-xl text-sm'
              >
                {mode}
              </li>
            ))}
          </ul>
        </div>

        <div className='bg-white/10 backdrop-blur-xs rounded-xl p-6 shadow-lg animate-slide-in'>
          <h2 className='text-2xl font-semibold mb-2'>
            Not sure where to fit?
          </h2>
          <p className='text-blue-100 mb-5'>
            Start in the Discord. It costs nothing, needs no technical skill,
            and everything else on this page starts there anyway.
          </p>
          <Link
            to='/discord'
            className='inline-flex items-center justify-center w-full px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all'
          >
            <SiDiscord className='h-5 w-5 mr-2' aria-hidden='true' />
            Start in the Discord
          </Link>
          <p className='text-blue-100 text-sm mt-4'>
            Already know what you want to do? The list below is ordered easiest
            first.
          </p>
        </div>
      </div>
    </div>
  </section>
);
