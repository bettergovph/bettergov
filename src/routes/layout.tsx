import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Ticker from '../components/ui/Ticker';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import ScrollToTop from '../components/ui/ScrollToTop';

export default function RootLayout() {
  return (
    <div className='min-h-screen flex flex-col'>
      <SEO />
      <Navbar />
      <Ticker />
      <ScrollToTop />
      <main className='flex-1'>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
