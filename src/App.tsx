import { lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import Navbar from './components/layout/Navbar';
import Ticker from './components/ui/Ticker';
import Footer from './components/layout/Footer';
import SEO from './components/SEO';
import ScrollToTop from './components/ui/ScrollToTop';

// lazy load imports for better chunking
const Home = lazy(() => import('./pages/Home'));
const DesignGuide = lazy(() => import('./pages/DesignGuide'));
const Services = lazy(() => import('./pages/services'));
const AboutPage = lazy(() => import('./pages/about'));
const AccessibilityPage = lazy(() => import('./pages/accessibility'));
const AboutPhilippines = lazy(() => import('./pages/philippines/about'));
const PhilippinesHistory = lazy(() => import('./pages/philippines/history'));
const PhilippinesCulture = lazy(() => import('./pages/philippines/culture'));
const PhilippinesRegions = lazy(() => import('./pages/philippines/regions'));
const PhilippinesMap = lazy(() => import('./pages/philippines/map'));
const PublicHolidays = lazy(() => import('./pages/philippines/holidays'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Hotlines = lazy(() => import('./pages/philippines/Hotlines'));
const VisaPage = lazy(() => import('./pages/travel/visa'));
const VisaTypesPage = lazy(() => import('./pages/travel/visa-types'));
const VisaTypeDetail = lazy(() => import('./pages/travel/visa-types/[type]'));
const CommunicatingPage = lazy(() => import('./pages/travel/communicating'));
const CommunicatingPrintPage = lazy(
  () => import('./pages/travel/communicating/print')
);
const ExecutiveDirectory = lazy(() => import('./pages/government/executive'));
const ExecutiveLayout = lazy(
  () => import('./pages/government/executive/layout')
);
const DepartmentsIndex = lazy(() => import('./pages/government/departments'));
const DepartmentDetail = lazy(
  () => import('./pages/government/departments/[department]')
);
const DepartmentsLayout = lazy(
  () => import('./pages/government/departments/layout')
);
const GovernmentLayout = lazy(() => import('./pages/government/layout'));
const ConstitutionalLayout = lazy(
  () => import('./pages/government/constitutional/layout')
);
const ConstitutionalIndex = lazy(
  () => import('./pages/government/constitutional/index')
);
const ConstitutionalOffice = lazy(
  () => import('./pages/government/constitutional/[office]')
);
const GOCCsPage = lazy(() => import('./pages/government/constitutional/goccs'));
const SUCsPage = lazy(() => import('./pages/government/constitutional/sucs'));

// Legislative Branch
const LegislativeLayout = lazy(
  () => import('./pages/government/legislative/layout')
);
const LegislativeIndex = lazy(
  () => import('./pages/government/legislative/index')
);
const LegislativeChamber = lazy(
  () => import('./pages/government/legislative/[chamber]')
);
const HouseMembersPage = lazy(
  () => import('./pages/government/legislative/house-members')
);
const PartyListMembersPage = lazy(
  () => import('./pages/government/legislative/party-list-members')
);
const SenateCommitteesPage = lazy(
  () => import('./pages/government/legislative/senate-committees')
);

// Diplomatic Section
const DiplomaticLayout = lazy(
  () => import('./pages/government/diplomatic/layout')
);
const DiplomaticIndex = lazy(
  () => import('./pages/government/diplomatic/index')
);
const DiplomaticMissionsPage = lazy(
  () => import('./pages/government/diplomatic/missions')
);
const ConsulatesPage = lazy(
  () => import('./pages/government/diplomatic/consulates')
);
const InternationalOrganizationsPage = lazy(
  () => import('./pages/government/diplomatic/organizations')
);
const OfficeOfThePresident = lazy(
  () => import('./pages/government/executive/office-of-the-president')
);
const OtherExecutiveOffices = lazy(
  () => import('./pages/government/executive/other-executive-offices')
);
const OfficeOfTheVicePresident = lazy(
  () => import('./pages/government/executive/office-of-the-vice-president')
);
const PresidentialCommunicationsOffice = lazy(
  () =>
    import('./pages/government/executive/presidential-communications-office')
);

// Local Government Units
const LocalLayout = lazy(
  () => import('./pages/government/local/components/LocalLayout')
);
const LocalGovernmentIndex = lazy(
  () => import('./pages/government/local/index')
);
const RegionalLGUPage = lazy(() => import('./pages/government/local/[region]'));

// Search Page
const SearchPage = lazy(() => import('./pages/Search'));

// Data Pages
const WeatherPage = lazy(() => import('./pages/data/weather'));
const ForexPage = lazy(() => import('./pages/data/forex'));
const FloodControlProjects = lazy(
  () => import('./pages/flood-control-projects')
);
const FloodControlProjectsTable = lazy(
  () => import('./pages/flood-control-projects/table')
);
const FloodControlProjectsMap = lazy(
  () => import('./pages/flood-control-projects/map')
);
const FloodControlProjectsContractors = lazy(
  () => import('./pages/flood-control-projects/contractors')
);
const ContractorDetail = lazy(
  () => import('./pages/flood-control-projects/contractors/[contractor-name]')
);

// Services Pages
const WebsitesDirectory = lazy(() => import('./pages/services/websites'));

// Sitemap Page
import SitemapPage from './pages/sitemap';
import Ideas from './pages/Ideas';
import JoinUs from './pages/JoinUs';
import TermsOfService from './pages/TermsOfService';
import ScrollToTop from './components/ui/ScrollToTop';
import Discord from './pages/Discord';
import SalaryGradePage from './pages/government/salary-grade/index';
import CivicAssistant from './components/ui/CivicAssistant';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NuqsAdapter>
        <div className='min-h-screen flex flex-col'>
          <SEO />
          <Navbar />
          <Ticker />
          <ScrollToTop />
          {/* todo: add a loader in suspense*/}
          <CivicAssistant />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/design' element={<DesignGuide />} />
            <Route path='/services' element={<Services />} />
            <Route path='/about' element={<AboutPage />} />
            <Route path='/contact' element={<ContactUs />} />
            <Route path='/accessibility' element={<AccessibilityPage />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/ideas' element={<Ideas />} />
            <Route path='/join-us' element={<JoinUs />} />
            <Route path='/terms-of-service' element={<TermsOfService />} />
            <Route path='/sitemap' element={<SitemapPage />} />
            <Route path='/discord' Component={Discord} />

            <Route path='/philippines'>
              <Route index element={<Navigate to='about' replace />} />
              <Route path='about' element={<AboutPhilippines />} />
              <Route path='history' element={<PhilippinesHistory />} />
              <Route path='culture' element={<PhilippinesCulture />} />
              <Route path='regions' element={<PhilippinesRegions />} />
              <Route path='map' element={<PhilippinesMap />} />
              <Route path='holidays' element={<PublicHolidays />} />
              <Route path='hotlines' element={<Hotlines />} />
            </Route>

            {/* Data Routes */}
            <Route path='/data/weather' element={<WeatherPage />} />
            <Route path='/data/forex' element={<ForexPage />} />
            <Route
              path='/flood-control-projects'
              element={<FloodControlProjects />}
            />
            <Route
              path='/flood-control-projects/table'
              element={<FloodControlProjectsTable />}
            />
            <Route
              path='/flood-control-projects/map'
              element={<FloodControlProjectsMap />}
            />
            <Route
              path='/flood-control-projects/contractors'
              element={<FloodControlProjectsContractors />}
            />
            <Route
              path='/flood-control-projects/contractors/:contractor-name'
              element={<ContractorDetail />}
            />

            {/* Services Routes */}
            <Route path='/services/websites' element={<WebsitesDirectory />} />

            {/* Travel Routes */}
            <Route path='/travel'>
              <Route index element={<Navigate to='visa' replace />} />
              <Route path='visa' element={<VisaPage />} />
              <Route path='visa-types' element={<VisaTypesPage />} />
              <Route path='visa-types/:type' element={<VisaTypeDetail />} />
              <Route path='communicating' element={<CommunicatingPage />} />
              <Route
                path='communicating/print'
                element={<CommunicatingPrintPage />}
              />
            </Route>

            {/* Government Routes */}
            <Route
              path='/government'
              element={<GovernmentLayout title='Government' />}
            >
              <Route index element={<Navigate to='executive' replace />} />
              <Route path='salary-grade' element={<SalaryGradePage />} />

              <Route path='executive' element={<ExecutiveLayout />}>
                <Route index element={<ExecutiveDirectory />} />
                <Route
                  path='other-executive-offices'
                  element={<OtherExecutiveOffices />}
                />
                <Route
                  path='office-of-the-president'
                  element={<OfficeOfThePresident />}
                />
                <Route
                  path='office-of-the-vice-president'
                  element={<OfficeOfTheVicePresident />}
                />
                <Route
                  path='presidential-communications-office'
                  element={<PresidentialCommunicationsOffice />}
                />
              </Route>

              <Route path='departments' element={<DepartmentsLayout />}>
                <Route index element={<DepartmentsIndex />} />
                <Route path=':department' element={<DepartmentDetail />} />
              </Route>

              <Route path='constitutional' element={<ConstitutionalLayout />}>
                <Route index element={<ConstitutionalIndex />} />
                <Route path=':office' element={<ConstitutionalOffice />} />
                <Route path='goccs' element={<GOCCsPage />} />
                <Route path='sucs' element={<SUCsPage />} />
              </Route>
              <Route path='legislative' element={<LegislativeLayout />}>
                <Route index element={<LegislativeIndex />} />
                <Route path=':chamber' element={<LegislativeChamber />} />
                <Route path='house-members' element={<HouseMembersPage />} />
                <Route
                  path='party-list-members'
                  element={<PartyListMembersPage />}
                />
                <Route
                  path='senate-committees'
                  element={<SenateCommitteesPage />}
                />
              </Route>
              <Route path='diplomatic' element={<DiplomaticLayout />}>
                <Route index element={<DiplomaticIndex />} />
                <Route path='missions' element={<DiplomaticMissionsPage />} />
                <Route path='consulates' element={<ConsulatesPage />} />
                <Route
                  path='organizations'
                  element={<InternationalOrganizationsPage />}
                />
              </Route>

              {/* Local Government Routes */}
              <Route path='local' element={<LocalLayout />}>
                <Route index element={<LocalGovernmentIndex />} />
                <Route path=':region' element={<RegionalLGUPage />} />
              </Route>
            </Route>

            {/*Not Found/404 Page */}
            <Route path='*' element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </NuqsAdapter>
    </Router>
  );
}

export default App;
