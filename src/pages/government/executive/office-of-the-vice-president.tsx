import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import ExecutiveOfficePage from './_ExecutiveOfficePage';

const OfficeOfTheVicePresident: FC = () => (
  <>
    <Helmet>
      <title>Office of the Vice President | BetterGov.ph</title>
      <meta
        name='description'
        content='The Office of the Vice President of the Philippines — with the Vice President, her senior staff, and office divisions.'
      />
    </Helmet>
    <ExecutiveOfficePage officeSlug='office-of-the-vice-president' />
  </>
);

export default OfficeOfTheVicePresident;
