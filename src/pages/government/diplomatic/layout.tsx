import { Outlet } from 'react-router-dom';
import DiplomaticSidebar from './components/DiplomaticSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function DiplomaticPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<DiplomaticSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
