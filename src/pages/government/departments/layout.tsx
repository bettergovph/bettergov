import { Outlet } from 'react-router-dom';
import DepartmentsSidebar from './components/DepartmentsSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function DepartmentsPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<DepartmentsSidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
