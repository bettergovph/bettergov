import React from 'react';
import Hero from '../components/home/Hero';
import JoinUsStrip from '../components/home/JoinUsStrip';
import ServicesSection from '../components/home/ServicesSection';
import InfoWidgets from '../components/home/InfoWidgets';
import PromotionBanner from '../components/home/PromotionBanner';
import JoinUsBanner from '../components/home/JoinUsBanner';
import GovernmentSection from '../components/home/GovernmentSection';
import DataSection from '../components/home/DataSection';

const Home: React.FC = () => {
  return (
    <main className='flex-grow'>
      <JoinUsStrip />
      <Hero />
      <ServicesSection />
      {/* <NewsSection /> */}
      <InfoWidgets />
      <DataSection />
      <JoinUsBanner />
      <PromotionBanner />
      <GovernmentSection />
    </main>
  );
};

export default Home;
