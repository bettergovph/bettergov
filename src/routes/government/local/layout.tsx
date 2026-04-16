import { Outlet, useParams } from 'react-router-dom';
import LocalSidebar from './components/LocalSidebar';
import GovernmentPageContainer from '../GovernmentPageContainer';

export default function LocalLayout() {
  const { region } = useParams<{ region: string }>();

  return (
    <GovernmentPageContainer sidebar={<LocalSidebar currentRegion={region} />}>
      <Outlet />
    </GovernmentPageContainer>
  );
}
