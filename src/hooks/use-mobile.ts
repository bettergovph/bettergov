import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(bp: number = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < bp);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);

    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, [bp]);

  return isMobile;
}
