import { FC } from 'react';
import { Helmet } from 'react-helmet-async';
import ExecutiveOfficePage from './_ExecutiveOfficePage';

const PresidentialCommunicationsOffice: FC = () => (
  <>
    <Helmet>
      <title>Presidential Communications Office | GOV.PH</title>
      <meta
        name='description'
        content='The Presidential Communications Office — the press and information arm of the Office of the President.'
      />
    </Helmet>
    <ExecutiveOfficePage officeSlug='presidential-communications-office' />
  </>
);

export default PresidentialCommunicationsOffice;
