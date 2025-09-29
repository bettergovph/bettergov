import { Outlet } from 'react-router-dom';
// import DepartmentsSidebar from './components/DepartmentsSidebar';
import JudiciarySidebar from './components/JudiciarySidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function DepartmentsPageLayout() {
  return (
    <GovernmentPageContainer sidebar={<JudiciarySidebar />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
