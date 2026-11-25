import { useEffect } from 'react';
import { nextHref } from '../lib/journey.js';
import { go } from '../lib/router.js';

/**
 * #/next: the guide's next step (src/lib/journey.js). It only passes the reader on, in place of itself, so Back
 * never lands here again. Every step is done: the end of the chronicle.
 */
export default function Next() {
  useEffect(() => {
    go(nextHref(), { replace: true });
  }, []);
  return <div className="h-full w-full bg-[#070a1a]" aria-busy="true" />;
}
