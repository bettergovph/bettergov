import { FC, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Container from '../ui/Container';
import AlertBanner from './AlertBanner';
import MastheadTop from './MastheadTop';
import LogoRow from './LogoRow';
import PrimaryNav from './PrimaryNav';
import MobileMenu from './MobileMenu';

const Masthead: FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide the masthead on the full-bleed map page
  if (location.pathname === '/philippines/map') return null;

  const toggleMobile = () => setMobileOpen(v => !v);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className='border-b border-ed-rule bg-white font-sans-ed text-ed-ink antialiased'>
      <AlertBanner />
      <Container>
        <MastheadTop />
        <LogoRow isMobileOpen={mobileOpen} onToggleMobile={toggleMobile} />
      </Container>
      <PrimaryNav />
      {mobileOpen && <MobileMenu onClose={closeMobile} />}
    </header>
  );
};

export default Masthead;
