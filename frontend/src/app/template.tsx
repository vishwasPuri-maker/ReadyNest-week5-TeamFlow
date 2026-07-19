'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

// Runs on every route change (App Router re-mounts templates), giving a
// smooth cross-page transition without hijacking Next's router.
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
