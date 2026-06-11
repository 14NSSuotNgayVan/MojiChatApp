import * as React from 'react';

const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

export function useCanHover() {
  const [canHover, setCanHover] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(HOVER_QUERY);
    const onChange = () => setCanHover(mql.matches);
    mql.addEventListener('change', onChange);
    setCanHover(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!canHover;
}
