import { motion, useReducedMotion } from 'motion/react';

/**
 * Scroll-reveal wrapper. Fades and lifts children into view once.
 * Honors prefers-reduced-motion by rendering statically.
 *
 * <Reveal delay={0.1}><Card/></Reveal>
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className = '',
  once = true,
  amount = 0.25,
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
      viewport={{ once, amount }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Stagger container: children revealed via <RevealItem> get sequenced timing. */
export function RevealGroup({ children, className = '', stagger = 0.08, amount = 0.2 }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
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
export function RevealItem({ children, className = '', y = 20 }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
