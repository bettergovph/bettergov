import { FC } from 'react';
import {
  Hero,
  Categories,
  EgovAppBanner,
  MostRequested,
  NewsAndHolidays,
  TransparencyStrip,
} from '../components/v2/home';

const Home: FC = () => (
  <main className='grow bg-white font-sans-ed text-ed-ink antialiased'>
    <Hero />
    <Categories />
    <EgovAppBanner />
    <MostRequested />
    <NewsAndHolidays />
    <TransparencyStrip />
  </main>
);

export default Home;
