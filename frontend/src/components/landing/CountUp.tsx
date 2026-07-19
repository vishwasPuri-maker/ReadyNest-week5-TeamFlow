'use client';

import { useEffect, useRef } from 'react';
import { animate, cubicBezier } from 'animejs';

interface CountUpProps {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

// Animates a number from 0 → `to` when it scrolls into view, using anime.js.
// Falls back to the final value instantly under reduced motion or if JS fails.
export function CountUp({ to, suffix = '', prefix = '', decimals = 0, duration = 1600, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const format = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;
    el.textContent = format(0);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = format(to);
      return;
    }

    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const proxy = { v: 0 };
      try {
        animate(proxy, {
          v: to,
          duration,
          ease: cubicBezier(0.16, 1, 0.3, 1),
          onUpdate: () => {
            el.textContent = format(proxy.v);
          },
          onComplete: () => {
            el.textContent = format(to);
          },
        });
      } catch {
        el.textContent = format(to);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, suffix, prefix, decimals, duration]);

  return <span ref={ref} className={className} />;
}
