import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';

// Keep necessary components loaded when needed immediately
import Navbar from './components/layout/Navbar';
import Ticker from './components/ui/Ticker';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/ui/ScrollToTop';

// Loading component
const LoadingSpinner = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
  </div>
);

// Define all lazy components upfront
const Home = lazy(() => import('./pages/Home'));
const DesignGuide = lazy(() => import('./pages/DesignGuide'));
const Services = lazy(() => import('./pages/services'));
const About = lazy(() => import('./pages/about'));
const Accessibility = lazy(() => import('./pages/accessibility'));
const Search = lazy(() => import('./pages/Search'));
const Ideas = lazy(() => import('./pages/Ideas'));
const JoinUs = lazy(() => import('./pages/JoinUs'));
const Sitemap = lazy(() => import('./pages/sitemap'));
const Discord = lazy(() => import('./pages/Discord'));

// Philippines pages
const PhilippinesAbout = lazy(() => import('./pages/philippines/about'));
const PhilippinesHistory = lazy(() => import('./pages/philippines/history'));
const PhilippinesCulture = lazy(() => import('./pages/philippines/culture'));
const PhilippinesRegions = lazy(() => import('./pages/philippines/regions'));
const PhilippinesMap = lazy(() => import('./pages/philippines/map'));
const PhilippinesHolidays = lazy(() => import('./pages/philippines/holidays'));
const PhilippinesHotlines = lazy(() => import('./pages/philippines/Hotlines'));

// Data pages
const DataWeather = lazy(() => import('./pages/data/weather'));
const DataForex = lazy(() => import('./pages/data/forex'));
const FloodControlProjects = lazy(
  () => import('./pages/flood-control-projects')
);
const FloodControlTable = lazy(
  () => import('./pages/flood-control-projects/table')
);
const FloodControlMap = lazy(
  () => import('./pages/flood-control-projects/map')
);
const FloodControlContractors = lazy(
  () => import('./pages/flood-control-projects/contractors')
);
const FloodControlContractorDetail = lazy(
  () => import('./pages/flood-control-projects/contractors/[contractor-name]')
);

// Services pages
const ServicesWebsites = lazy(() => import('./pages/services/websites'));

// Travel pages
const TravelVisa = lazy(() => import('./pages/travel/visa'));
const TravelVisaTypes = lazy(() => import('./pages/travel/visa-types'));
const TravelVisaTypeDetail = lazy(
  () => import('./pages/travel/visa-types/[type]')
);

// Government pages
const GovernmentLayout = lazy(() => import('./pages/government/layout'));
const ExecutiveLayout = lazy(
  () => import('./pages/government/executive/layout')
);
const Executive = lazy(() => import('./pages/government/executive'));
const OtherExecutiveOffices = lazy(
  () => import('./pages/government/executive/other-executive-offices')
);
const OfficeOfThePresident = lazy(
  () => import('./pages/government/executive/office-of-the-president')
);
const OfficeOfTheVicePresident = lazy(
  () => import('./pages/government/executive/office-of-the-vice-president')
);
const PresidentialCommunicationsOffice = lazy(
  () =>
    import('./pages/government/executive/presidential-communications-office')
);

const DepartmentsLayout = lazy(
  () => import('./pages/government/departments/layout')
);
const Departments = lazy(() => import('./pages/government/departments'));
const DepartmentDetail = lazy(
  () => import('./pages/government/departments/[department]')
);

const ConstitutionalLayout = lazy(
  () => import('./pages/government/constitutional/layout')
);
const ConstitutionalIndex = lazy(
  () => import('./pages/government/constitutional/index')
);
const ConstitutionalOffice = lazy(
  () => import('./pages/government/constitutional/[office]')
);
const ConstitutionalGoccs = lazy(
  () => import('./pages/government/constitutional/goccs')
);
const ConstitutionalSucs = lazy(
  () => import('./pages/government/constitutional/sucs')
);

const LegislativeLayout = lazy(
  () => import('./pages/government/legislative/layout')
);
const LegislativeIndex = lazy(
  () => import('./pages/government/legislative/index')
);
const LegislativeChamber = lazy(
  () => import('./pages/government/legislative/[chamber]')
);
const HouseMembers = lazy(
  () => import('./pages/government/legislative/house-members')
);
const PartyListMembers = lazy(
  () => import('./pages/government/legislative/party-list-members')
);
const SenateCommittees = lazy(
  () => import('./pages/government/legislative/senate-committees')
);

const DiplomaticLayout = lazy(
  () => import('./pages/government/diplomatic/layout')
);
const DiplomaticIndex = lazy(
  () => import('./pages/government/diplomatic/index')
);
const DiplomaticMissions = lazy(
  () => import('./pages/government/diplomatic/missions')
);
const DiplomaticConsulates = lazy(
  () => import('./pages/government/diplomatic/consulates')
);
const DiplomaticOrganizations = lazy(
  () => import('./pages/government/diplomatic/organizations')
);

const LocalLayout = lazy(
  () => import('./pages/government/local/components/LocalLayout')
);
const LocalIndex = lazy(() => import('./pages/government/local/index'));
const LocalRegion = lazy(() => import('./pages/government/local/[region]'));

function App() {
  return (
    <Router>
      <NuqsAdapter>
        <div className='min-h-screen flex flex-col'>
          <Navbar />
          <Ticker />
          <ScrollToTop />

          {/* Single Suspense wrapper for all routes */}
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/design' element={<DesignGuide />} />
              <Route path='/services' element={<Services />} />
              <Route path='/about' element={<About />} />
              <Route path='/accessibility' element={<Accessibility />} />
              <Route path='/search' element={<Search />} />
              <Route path='/ideas' element={<Ideas />} />
              <Route path='/join-us' element={<JoinUs />} />
              <Route path='/sitemap' element={<Sitemap />} />
              <Route path='/discord' element={<Discord />} />

              <Route path='/philippines'>
                <Route index element={<Navigate to='about' replace />} />
                <Route path='about' element={<PhilippinesAbout />} />
                <Route path='history' element={<PhilippinesHistory />} />
                <Route path='culture' element={<PhilippinesCulture />} />
                <Route path='regions' element={<PhilippinesRegions />} />
                <Route path='map' element={<PhilippinesMap />} />
                <Route path='holidays' element={<PhilippinesHolidays />} />
                <Route path='hotlines' element={<PhilippinesHotlines />} />
              </Route>

              {/* Data Routes */}
              <Route path='/data/weather' element={<DataWeather />} />
              <Route path='/data/forex' element={<DataForex />} />
              <Route
                path='/flood-control-projects'
                element={<FloodControlProjects />}
              />
              <Route
                path='/flood-control-projects/table'
                element={<FloodControlTable />}
              />
              <Route
                path='/flood-control-projects/map'
                element={<FloodControlMap />}
              />
              <Route
                path='/flood-control-projects/contractors'
                element={<FloodControlContractors />}
              />
              <Route
                path='/flood-control-projects/contractors/:contractor-name'
                element={<FloodControlContractorDetail />}
              />

              {/* Services Routes */}
              <Route path='/services/websites' element={<ServicesWebsites />} />

              {/* Travel Routes */}
              <Route path='/travel'>
                <Route index element={<Navigate to='visa' replace />} />
                <Route path='visa' element={<TravelVisa />} />
                <Route path='visa-types' element={<TravelVisaTypes />} />
                <Route
                  path='visa-types/:type'
                  element={<TravelVisaTypeDetail />}
                />
              </Route>

              {/* Government Routes */}
              <Route
                path='/government'
                element={<GovernmentLayout title='Government' />}
              >
                <Route index element={<Navigate to='executive' replace />} />

                <Route path='executive' element={<ExecutiveLayout />}>
                  <Route index element={<Executive />} />
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
                  <Route index element={<Departments />} />
                  <Route path=':department' element={<DepartmentDetail />} />
                </Route>

                <Route path='constitutional' element={<ConstitutionalLayout />}>
                  <Route index element={<ConstitutionalIndex />} />
                  <Route path=':office' element={<ConstitutionalOffice />} />
                  <Route path='goccs' element={<ConstitutionalGoccs />} />
                  <Route path='sucs' element={<ConstitutionalSucs />} />
                </Route>

                <Route path='legislative' element={<LegislativeLayout />}>
                  <Route index element={<LegislativeIndex />} />
                  <Route path=':chamber' element={<LegislativeChamber />} />
                  <Route path='house-members' element={<HouseMembers />} />
                  <Route
                    path='party-list-members'
                    element={<PartyListMembers />}
                  />
                  <Route
                    path='senate-committees'
                    element={<SenateCommittees />}
                  />
                </Route>

                <Route path='diplomatic' element={<DiplomaticLayout />}>
                  <Route index element={<DiplomaticIndex />} />
                  <Route path='missions' element={<DiplomaticMissions />} />
                  <Route path='consulates' element={<DiplomaticConsulates />} />
                  <Route
                    path='organizations'
                    element={<DiplomaticOrganizations />}
                  />
                </Route>

                <Route path='local' element={<LocalLayout />}>
                  <Route index element={<LocalIndex />} />
                  <Route path=':region' element={<LocalRegion />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>

          <Footer />
        </div>
      </NuqsAdapter>
    </Router>
  );
}

export default App;
