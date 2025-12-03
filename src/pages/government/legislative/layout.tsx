import { Outlet } from 'react-router-dom';
import LegislativeSidebar from './components/LegislativeSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function LegislativePageLayout() {
  return (
    <GovernmentPageContainer sidebar={<LegislativeSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
