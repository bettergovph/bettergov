import { Outlet } from 'react-router-dom';
import ExecutiveSidebar from './components/ExecutiveSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function ExecutiveLayout() {
  return (
    <GovernmentPageContainer sidebar={<ExecutiveSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
