import { stepName, stepsAround } from '../lib/journey.js';
import { useStore } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';

/**
 * The journey around the reader as one line of light: the step just done, the one they are at (lit), and the next.
 * It only shows the order. The button beside it does the step, and the Journey page (#/story) holds every one.
 */
export default function Rail({ className = '' }) {
  const state = useStore();
  const steps = stepsAround(state);
  if (!steps.length) return null;
  return (
    <ol aria-label="Your journey, around here" className={`grid grid-cols-3 ${className}`}>
      {steps.map(({ step, is }, i) => (
        <li key={step.id} aria-current={is === 'now' ? 'step' : undefined} className="relative pr-3 pt-[23px] font-body text-[0.98rem] leading-[1.15]">
          {/* the line runs on from this step to the next, and fades after the last: there is more */}
          <span
            aria-hidden="true"
            className={`absolute left-[15px] right-0 top-[7px] h-px ${is === 'done' ? 'bg-gold/80' : i === steps.length - 1 ? 'bg-gradient-to-r from-gold/45 to-transparent' : 'bg-gold/40'}`}
          />
          <span
            aria-hidden="true"
            className={`absolute left-0 top-0 grid h-[15px] w-[15px] place-items-center rounded-full border ${
              is === 'done'
                ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]'
                : is === 'now'
                  ? 'border-gold-hi bg-gold-hi shadow-[0_0_0_4px_rgba(226,187,104,0.22),0_0_16px_rgba(226,187,104,0.55)]'
                  : 'border-gold/60 bg-[#0c0b12]'
            }`}
          >
            {is === 'done' && <Icon name="check" className="h-2.5 w-2.5" />}
          </span>
          <span className={`block text-balance ${is === 'now' ? 'font-semibold text-gold-hi' : 'text-ivory/70'}`}>
            {stepName(step)}
            {is === 'done' && <span className="sr-only"> (done)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
