import { Outlet } from 'react-router-dom';
import GovernmentPageContainer from '../../government/GovernmentPageContainer';
import ConstitutionSidebar from './components/ConstitutionSidebar';

export default function ConstitutionPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<ConstitutionSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
