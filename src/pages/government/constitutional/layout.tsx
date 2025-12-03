import { Outlet } from 'react-router-dom';
import ConstitutionalSidebar from './components/ConstitutionalSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function ConstitutionalPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<ConstitutionalSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
