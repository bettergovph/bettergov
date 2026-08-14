import { Outlet } from 'react-router-dom';
import JudicialSidebar from './components/JudicialSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function JudicialPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<JudicialSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
