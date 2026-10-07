import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import ExecutiveOfficePage from './_ExecutiveOfficePage';

const OfficeOfThePresident: FC = () => (
  <>
    <Helmet>
      <title>Office of the President | GOV.PH</title>
      <meta
        name='description'
        content='The Office of the President of the Philippines — the principal executive and administrative arm of the President, including the Office of the Executive Secretary.'
      />
    </Helmet>
    <ExecutiveOfficePage officeSlug='office-of-the-president' />
  </>
);

export default OfficeOfThePresident;
