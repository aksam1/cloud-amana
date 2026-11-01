// Shared by the stage and every layer. Kept in its own module (it imports no layers) so editing
// a layer during development never re-creates the context the other layers are reading.
import { createContext, useContext, useId } from 'react';

export const StageCtx = createContext(null);
export const useStage = () => useContext(StageCtx);

/** SVG ids must be unique per layer instance and safe inside url(#…). */
export function useUid(prefix = 'u') {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/** Full-bleed SVG in design coordinates. */
export function Svg({ children, className = '', style }) {
  const { vb } = useStage();
  return (
    <svg viewBox={vb.join(' ')} preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 h-full w-full overflow-visible ${className}`} style={style} aria-hidden="true">
      {children}
    </svg>
  );
}

/** Design point → CSS percentage of the stage (for HTML/CSS layers). */
export function usePct() {
  const { vb } = useStage();
  return (x, y) => ({ left: `${((x - vb[0]) / vb[2]) * 100}%`, top: `${((y - vb[1]) / vb[3]) * 100}%` });
}
