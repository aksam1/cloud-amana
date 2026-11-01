import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** Modeless feedback: a short line that confirms a setting change and fades without blocking anything. */
export function useToast(ms = 3200) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback(
    (text) => {
      clearTimeout(timer.current);
      setMsg({ text, id: Date.now() });
      timer.current = setTimeout(() => setMsg(null), ms);
    },
    [ms],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, show];
}

export function Toast({ message }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-50 flex justify-center px-4 sm:top-20" role="status" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div key={message.id} className="rounded-full border border-gold/40 bg-black/70 px-4 py-2 font-body text-[1rem] text-ivory backdrop-blur-md" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
