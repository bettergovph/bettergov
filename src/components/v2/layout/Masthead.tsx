import { FC, useState } from 'react';
import Container from '../ui/Container';
import MastheadTop from './MastheadTop';
import LogoRow from './LogoRow';
import PrimaryNav from './PrimaryNav';
import MobileMenu from './MobileMenu';

const Masthead: FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(v => !v);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className='bg-white font-sans-ed text-ed-ink antialiased border-b border-b-2 border-b-blue-950 shadow-md'>
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
