import { FC } from 'react';
import {
  Hero,
  Categories,
  MostRequested,
  NewsAndHolidays,
  TransparencyStrip,
  EditorialStrip,
} from '../components/v2/home';

const Home: FC = () => (
  <main className='grow bg-white font-sans-ed text-ed-ink antialiased'>
    <Hero />
    <Categories />
    <MostRequested />
    <NewsAndHolidays />
    <TransparencyStrip />
    <EditorialStrip />
  </main>
);

export default Home;
