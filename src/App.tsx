import React, { Suspense, lazy, ComponentType } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6';

// Keep necessary components loaded  when needed immediately
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

// Lazy loading utility
const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<T> }>
): React.ReactElement => (
  <Suspense fallback={<LoadingSpinner />}>
    {React.createElement(lazy(importFn))}
  </Suspense>
);

function App() {
  return (
    <Router>
      <NuqsAdapter>
        <div className='min-h-screen flex flex-col'>
          <Navbar />
          <Ticker />
          <ScrollToTop />
          <Routes>
            <Route
              path='/'
              element={createLazyRoute(() => import('./pages/Home'))}
            />
            <Route
              path='/design'
              element={createLazyRoute(() => import('./pages/DesignGuide'))}
            />
            <Route
              path='/services'
              element={createLazyRoute(() => import('./pages/services'))}
            />
            <Route
              path='/about'
              element={createLazyRoute(() => import('./pages/about'))}
            />
            <Route
              path='/accessibility'
              element={createLazyRoute(() => import('./pages/accessibility'))}
            />
            <Route
              path='/search'
              element={createLazyRoute(() => import('./pages/Search'))}
            />
            <Route
              path='/ideas'
              element={createLazyRoute(() => import('./pages/Ideas'))}
            />
            <Route
              path='/join-us'
              element={createLazyRoute(() => import('./pages/JoinUs'))}
            />
            <Route
              path='/sitemap'
              element={createLazyRoute(() => import('./pages/sitemap'))}
            />
            <Route
              path='/discord'
              element={createLazyRoute(() => import('./pages/Discord'))}
            />

            <Route path='/philippines'>
              <Route index element={<Navigate to='about' replace />} />
              <Route
                path='about'
                element={createLazyRoute(
                  () => import('./pages/philippines/about')
                )}
              />
              <Route
                path='history'
                element={createLazyRoute(
                  () => import('./pages/philippines/history')
                )}
              />
              <Route
                path='culture'
                element={createLazyRoute(
                  () => import('./pages/philippines/culture')
                )}
              />
              <Route
                path='regions'
                element={createLazyRoute(
                  () => import('./pages/philippines/regions')
                )}
              />
              <Route
                path='map'
                element={createLazyRoute(
                  () => import('./pages/philippines/map')
                )}
              />
              <Route
                path='holidays'
                element={createLazyRoute(
                  () => import('./pages/philippines/holidays')
                )}
              />
              <Route
                path='hotlines'
                element={createLazyRoute(
                  () => import('./pages/philippines/Hotlines')
                )}
              />
            </Route>

            {/* Data Routes */}
            <Route
              path='/data/weather'
              element={createLazyRoute(() => import('./pages/data/weather'))}
            />
            <Route
              path='/data/forex'
              element={createLazyRoute(() => import('./pages/data/forex'))}
            />
            <Route
              path='/flood-control-projects'
              element={createLazyRoute(
                () => import('./pages/flood-control-projects')
              )}
            />
            <Route
              path='/flood-control-projects/table'
              element={createLazyRoute(
                () => import('./pages/flood-control-projects/table')
              )}
            />
            <Route
              path='/flood-control-projects/map'
              element={createLazyRoute(
                () => import('./pages/flood-control-projects/map')
              )}
            />
            <Route
              path='/flood-control-projects/contractors'
              element={createLazyRoute(
                () => import('./pages/flood-control-projects/contractors')
              )}
            />
            <Route
              path='/flood-control-projects/contractors/:contractor-name'
              element={createLazyRoute(
                () =>
                  import(
                    './pages/flood-control-projects/contractors/[contractor-name]'
                  )
              )}
            />

            {/* Services Routes */}
            <Route
              path='/services/websites'
              element={createLazyRoute(
                () => import('./pages/services/websites')
              )}
            />

            {/* Travel Routes */}
            <Route path='/travel'>
              <Route index element={<Navigate to='visa' replace />} />
              <Route
                path='visa'
                element={createLazyRoute(() => import('./pages/travel/visa'))}
              />
              <Route
                path='visa-types'
                element={createLazyRoute(
                  () => import('./pages/travel/visa-types')
                )}
              />
              <Route
                path='visa-types/:type'
                element={
                  <React.Suspense
                    fallback={
                      <div className='flex items-center justify-center min-h-screen'>
                        Loading...
                      </div>
                    }
                  >
                    {React.createElement(
                      lazy(() => import('./pages/travel/visa-types/[type]'))
                    )}
                  </React.Suspense>
                }
              />
            </Route>

            {/* Government Routes */}
            <Route
              path='/government'
              element={createLazyRoute(
                () => import('./pages/government/layout')
              )}
            >
              <Route index element={<Navigate to='executive' replace />} />

              <Route
                path='executive'
                element={createLazyRoute(
                  () => import('./pages/government/executive/layout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/executive')
                  )}
                />
                <Route
                  path='other-executive-offices'
                  element={createLazyRoute(
                    () =>
                      import(
                        './pages/government/executive/other-executive-offices'
                      )
                  )}
                />
                <Route
                  path='office-of-the-president'
                  element={createLazyRoute(
                    () =>
                      import(
                        './pages/government/executive/office-of-the-president'
                      )
                  )}
                />
                <Route
                  path='office-of-the-vice-president'
                  element={createLazyRoute(
                    () =>
                      import(
                        './pages/government/executive/office-of-the-vice-president'
                      )
                  )}
                />
                <Route
                  path='presidential-communications-office'
                  element={createLazyRoute(
                    () =>
                      import(
                        './pages/government/executive/presidential-communications-office'
                      )
                  )}
                />
              </Route>

              <Route
                path='departments'
                element={createLazyRoute(
                  () => import('./pages/government/departments/layout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/departments')
                  )}
                />
                <Route
                  path=':department'
                  element={createLazyRoute(
                    () => import('./pages/government/departments/[department]')
                  )}
                />
              </Route>

              <Route
                path='constitutional'
                element={createLazyRoute(
                  () => import('./pages/government/constitutional/layout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/constitutional/index')
                  )}
                />
                <Route
                  path=':office'
                  element={createLazyRoute(
                    () => import('./pages/government/constitutional/[office]')
                  )}
                />
                <Route
                  path='goccs'
                  element={createLazyRoute(
                    () => import('./pages/government/constitutional/goccs')
                  )}
                />
                <Route
                  path='sucs'
                  element={createLazyRoute(
                    () => import('./pages/government/constitutional/sucs')
                  )}
                />
              </Route>
              <Route
                path='legislative'
                element={createLazyRoute(
                  () => import('./pages/government/legislative/layout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/legislative/index')
                  )}
                />
                <Route
                  path=':chamber'
                  element={createLazyRoute(
                    () => import('./pages/government/legislative/[chamber]')
                  )}
                />
                <Route
                  path='house-members'
                  element={createLazyRoute(
                    () => import('./pages/government/legislative/house-members')
                  )}
                />
                <Route
                  path='party-list-members'
                  element={createLazyRoute(
                    () =>
                      import(
                        './pages/government/legislative/party-list-members'
                      )
                  )}
                />
                <Route
                  path='senate-committees'
                  element={createLazyRoute(
                    () =>
                      import('./pages/government/legislative/senate-committees')
                  )}
                />
              </Route>
              <Route
                path='diplomatic'
                element={createLazyRoute(
                  () => import('./pages/government/diplomatic/layout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/diplomatic/index')
                  )}
                />
                <Route
                  path='missions'
                  element={createLazyRoute(
                    () => import('./pages/government/diplomatic/missions')
                  )}
                />
                <Route
                  path='consulates'
                  element={createLazyRoute(
                    () => import('./pages/government/diplomatic/consulates')
                  )}
                />
                <Route
                  path='organizations'
                  element={createLazyRoute(
                    () => import('./pages/government/diplomatic/organizations')
                  )}
                />
              </Route>

              {/* Local Government Routes */}
              <Route
                path='local'
                element={createLazyRoute(
                  () =>
                    import('./pages/government/local/components/LocalLayout')
                )}
              >
                <Route
                  index
                  element={createLazyRoute(
                    () => import('./pages/government/local/index')
                  )}
                />
                <Route
                  path=':region'
                  element={createLazyRoute(
                    () => import('./pages/government/local/[region]')
                  )}
                />
              </Route>
            </Route>
          </Routes>
          <Footer />
        </div>
      </NuqsAdapter>
    </Router>
  );
}

export default App;
