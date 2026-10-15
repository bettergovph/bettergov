import { lazy, ReactNode, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SEO from './components/SEO';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';
import DesignSystemLayout from './pages/design/layout';
import DesignSystemHome from './pages/design';
import DesignStyles from './pages/design/styles';
import DesignComponents from './pages/design/components';
import DesignPatterns from './pages/design/patterns';
import DesignAccessibility from './pages/design/accessibility';
import DesignBrandGuide from './pages/design/guide';
import Services from './pages/services';
import AboutPage from './pages/about';
import AccessibilityPage from './pages/accessibility';
import AboutPhilippines from './pages/philippines/about';
import PhilippinesHistory from './pages/philippines/history';
import PhilippinesCulture from './pages/philippines/culture';
import PhilippinesRegions from './pages/philippines/regions';
import PhilippinesMap from './pages/philippines/map';
import PublicHolidays from './pages/philippines/holidays';
import ContactUs from './pages/ContactUs';
import Hotlines from './pages/philippines/Hotlines';
import VisaPage from './pages/travel/visa';
import VisaTypesPage from './pages/travel/visa-types';
import VisaTypeDetail from './pages/travel/visa-types/[type]';
import CommunicatingPage from './pages/travel/communicating';
import CommunicatingPrintPage from './pages/travel/communicating/print';
import ExecutiveDirectory from './pages/government/executive';
import DepartmentsIndex from './pages/government/departments';
import DepartmentDetail from './pages/government/departments/[department]';
import ConstitutionalIndex from './pages/government/constitutional/index';
import ConstitutionalOffice from './pages/government/constitutional/[office]';
import GOCCsPage from './pages/government/constitutional/goccs';
import SUCsPage from './pages/government/constitutional/sucs';

// Legislative Branch
import LegislativeIndex from './pages/government/legislative/index';
import LegislativeChamber from './pages/government/legislative/[chamber]';
import HouseMembersPage from './pages/government/legislative/house-members';
import PartyListMembersPage from './pages/government/legislative/party-list-members';
import SenateCommitteesPage from './pages/government/legislative/senate-committees';

// Diplomatic Section
import DiplomaticIndex from './pages/government/diplomatic/index';
import DiplomaticMissionsPage from './pages/government/diplomatic/missions';
import ConsulatesPage from './pages/government/diplomatic/consulates';
import InternationalOrganizationsPage from './pages/government/diplomatic/organizations';
import OfficeOfThePresident from './pages/government/executive/office-of-the-president';
import OtherExecutiveOffices from './pages/government/executive/other-executive-offices';
import OfficeOfTheVicePresident from './pages/government/executive/office-of-the-vice-president';
import PresidentialCommunicationsOffice from './pages/government/executive/presidential-communications-office';
import President from './pages/government/executive/president';
import VicePresident from './pages/government/executive/vice-president';
// Judicial Branch
import JudicialLayout from './pages/government/judicial/layout';
import JudicialIndex from './pages/government/judicial/index';
// Local Government Units
import LocalGovernmentIndex from './pages/government/local/index';
import RegionalLGUPage from './pages/government/local/[region]';

// Search Page
import SearchPage from './pages/Search';

// News (e.gov.ph)
import NewsIndex from './pages/news';
import NewsArticlePage from './pages/news/[id]';

// Government directory (new /government index) + tabs layout
import GovernmentDirectory from './pages/government';
import GovernmentLayout from './pages/government/layout';
import GovernmentOverview from './pages/government/overview';

// Guides
import GuidesIndex from './pages/guides';
import GuideLoading from './pages/guides/GuideLoading';
const GuideArticle = lazy(() => import('./pages/guides/GuideArticle'));

// Data Pages
import WeatherPage from './pages/data/weather';
import ForexPage from './pages/data/forex';
import FloodControlProjects from './pages/flood-control-projects';
import FloodControlProjectsTable from './pages/flood-control-projects/table';
import FloodControlProjectsMap from './pages/flood-control-projects/map';
import FloodControlProjectsContractors from './pages/flood-control-projects/contractors';
import ContractorDetail from './pages/flood-control-projects/contractors/[contractor-name]';

// Services Pages
import WebsitesDirectory from './pages/services/websites';

// Sitemap Page
import SitemapPage from './pages/sitemap';
import TermsOfService from './pages/TermsOfService';
import ScrollToTop from './components/ui/ScrollToTop';
import SalaryGradePage from './pages/government/salary-grade/index';
import GovPhChatbot from './components/ui/GovPhChatbot';
import NotFound from './pages/NotFound';

/** Site header, footer and assistant — kept off the full-bleed landing. */
function SiteChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return pathname === '/' ? null : <>{children}</>;
}

function App() {
  return (
    <Router>
      <NuqsAdapter>
        {/* svh, not vh: on phones 100vh is taller than the screen while the
            browser bars show, so short pages like the landing would scroll. */}
        <div className='min-h-svh flex flex-col'>
          <SEO />
          <ScrollToTop />
          <SiteChrome>
            <Navbar />
            <GovPhChatbot />
          </SiteChrome>
          <Routes>
            {/* Coming-soon page until launch; the portal home page lives at
                /home meanwhile. To restore it, route `/` back to <Home /> and
                drop SiteChrome. */}
            <Route path='/' element={<ComingSoon />} />
            <Route path='/home' element={<Home />} />
            <Route path='/design'>
              {/* The brand guide presentation is the front door — full
                  bleed, outside the sidebar layout on purpose. */}
              <Route index element={<DesignBrandGuide />} />
              <Route path='guide' element={<Navigate to='/design' replace />} />
              <Route element={<DesignSystemLayout />}>
                <Route path='overview' element={<DesignSystemHome />} />
                <Route path='styles' element={<DesignStyles />} />
                <Route path='components' element={<DesignComponents />} />
                <Route path='patterns' element={<DesignPatterns />} />
                <Route path='accessibility' element={<DesignAccessibility />} />
              </Route>
            </Route>
            <Route path='/services' element={<Services />} />
            <Route path='/about' element={<AboutPage />} />
            <Route path='/contact' element={<ContactUs />} />
            <Route path='/accessibility' element={<AccessibilityPage />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/news'>
              <Route index element={<NewsIndex />} />
              <Route path=':id' element={<NewsArticlePage />} />
            </Route>
            <Route path='/guides' element={<GuidesIndex />} />
            <Route
              path='/guides/:guideId'
              element={
                <Suspense fallback={<GuideLoading />}>
                  <GuideArticle />
                </Suspense>
              }
            />
            <Route path='/terms-of-service' element={<TermsOfService />} />
            <Route path='/sitemap' element={<SitemapPage />} />

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
              <Route
                path='visa-types/:type'
                element={
                  <Suspense
                    fallback={
                      <div className='flex items-center justify-center min-h-screen'>
                        Loading...
                      </div>
                    }
                  >
                    <VisaTypeDetail />
                  </Suspense>
                }
              />
              <Route path='communicating' element={<CommunicatingPage />} />
              <Route
                path='communicating/print'
                element={<CommunicatingPrintPage />}
              />
            </Route>

            {/* Government Routes */}
            <Route path='/government' element={<GovernmentLayout />}>
              <Route index element={<GovernmentDirectory />} />
              <Route path='overview' element={<GovernmentOverview />} />
              <Route path='salary-grade' element={<SalaryGradePage />} />

              {/* Executive */}
              <Route path='executive'>
                <Route index element={<ExecutiveDirectory />} />
                <Route
                  path='other-executive-offices'
                  element={<OtherExecutiveOffices />}
                />
                <Route path='president' element={<President />} />
                <Route path='vice-president' element={<VicePresident />} />
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

              {/* Departments */}
              <Route path='departments'>
                <Route index element={<DepartmentsIndex />} />
                {/* NEDA became DEPDev under RA 12145 (2025). */}
                <Route
                  path='national-economic-and-development-authority'
                  element={
                    <Navigate
                      to='/government/departments/department-of-economy-planning-and-development'
                      replace
                    />
                  }
                />
                <Route path=':department' element={<DepartmentDetail />} />
              </Route>

              {/* Constitutional */}
              <Route path='constitutional'>
                <Route index element={<ConstitutionalIndex />} />
                <Route path=':office' element={<ConstitutionalOffice />} />
                <Route path='goccs' element={<GOCCsPage />} />
                <Route path='sucs' element={<SUCsPage />} />
              </Route>

              {/* Legislative */}
              <Route path='legislative'>
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

              {/* Diplomatic */}
              <Route path='diplomatic'>
                <Route index element={<DiplomaticIndex />} />
                <Route path='missions' element={<DiplomaticMissionsPage />} />
                <Route path='consulates' element={<ConsulatesPage />} />
                <Route
                  path='organizations'
                  element={<InternationalOrganizationsPage />}
                />
              </Route>

              {/* Local Government Routes */}
              <Route path='local'>
                <Route index element={<LocalGovernmentIndex />} />
                <Route path=':region' element={<RegionalLGUPage />} />
              </Route>

              <Route path='judicial' element={<JudicialLayout />}>
                <Route index element={<JudicialIndex />} />
                <Route path=':court' element={<JudicialIndex />} />
              </Route>
            </Route>

            {/*Not Found/404 Page */}
            <Route path='*' element={<NotFound />} />
          </Routes>
          <SiteChrome>
            <Footer />
          </SiteChrome>
        </div>
      </NuqsAdapter>
    </Router>
  );
}

export default App;
