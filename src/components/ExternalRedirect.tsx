import { FC, useEffect } from 'react';

type Props = {
  /** Absolute URL on another site. */
  to: string;
};

/**
 * Sends the browser to a page on another site, replacing the current history
 * entry so Back skips the redirect. React Router's <Navigate> only handles
 * paths inside this app.
 */
const ExternalRedirect: FC<Props> = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
};

export default ExternalRedirect;
