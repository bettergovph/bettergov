import { useEffect } from 'react';
import { SITE_NAME } from '../lib/brand';

const SITE_TITLE = SITE_NAME;

/**
 * Set the document title imperatively.
 *
 * `<Helmet>` emits correctly on mount but does not re-emit when its props
 * change under React 19, so pages whose title depends on fetched data (an
 * article headline) or on client-side navigation (a page number) get a stale
 * title. This keeps those in sync. Pages should still declare their metadata
 * through Helmet/`<SEO>` — this is only a belt for the title.
 *
 * Pass `null` while the title is still unknown to leave it untouched.
 */
export const useDocumentTitle = (title: string | null): void => {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} | ${SITE_TITLE}`;
  }, [title]);
};

export default useDocumentTitle;
