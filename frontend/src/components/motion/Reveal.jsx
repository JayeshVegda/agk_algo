import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Scroll-reveal wrapper. Fades and lifts children into view reliably.
 * Uses generous viewport margin (50px) and low threshold (0.05) so elements
 * are never stuck invisible at opacity: 0.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  className = '',
  as = 'div',
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as] || motion.div;

  if (reduce) {
    const Static = as || 'div';
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01, margin: '140px 0px' }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Stagger container: children revealed via <RevealItem> get sequenced timing. */
export function RevealGroup({ children, className = '', stagger = 0.06 }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05, margin: '80px 0px' }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Child of <RevealGroup>. */
export function RevealItem({ children, className = '', y = 14 }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
