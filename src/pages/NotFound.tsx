import { Link } from 'react-router-dom';

import { HomeIcon, AlertTriangleIcon } from 'lucide-react';
import Button from '../components/ui/Button';

import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800'>
      <Helmet>
        <title>Page Not Found! | BetterGov.ph</title>
        <meta
          name='description'
          content='You might be lost, like some of our government (ghost) services..'
        />
        <meta name='keywords' content='Not Found, 404, Page Not Found' />
        <link rel='canonical' href='https://bettergov.ph/not-found' />

        {/* Open Graph / Social */}
        <meta property='og:title' content='Page Not Found! | BetterGov.ph' />
        <meta
          property='og:description'
          content='You might be lost, like some of our government (ghost) services..'
        />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://bettergov.ph/not-found' />
        <meta property='og:image' content='https://bettergov.ph/ph-logo.png' />
      </Helmet>

      <div className='relative'>
        <div className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10'>
          {/* 404 Section */}
          <div className='text-center mb-16'>
            <div className='inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-8'>
              <AlertTriangleIcon className='w-12 h-12 text-white' />
            </div>
            <h1 className='text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight'>
              404
            </h1>
            <div className='space-y-4 mb-8'>
              <h2 className='text-2xl md:text-3xl font-semibold text-white'>
                Lost in the Digital Bureaucracy?
              </h2>
              <p className='text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed'>
                Relax, even the best systems have their maze-like moments. This
                page seems to have gotten stuck in processing... probably
                waiting for approval from three (or more) different departments.
              </p>
            </div>
            {/* Actions */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Link to='/'>
                <Button
                  size='lg'
                  className='bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8'
                >
                  <HomeIcon className='w-5 h-5 mr-2' />
                  Return to Homepage
                </Button>
              </Link>
              <Button
                variant='outline'
                size='lg'
                className='border-white text-white hover:bg-white/10 px-8'
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
