'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

// Scroll-triggered entrance that is VISIBLE BY DEFAULT.
// SSR / no-JS / reduced-motion all render the element fully visible; the hidden
// "from" state is only armed on the client after mount, so a failed hydration
// can never ship a blank section. A safety timer reveals anything the observer
// hasn't caught (e.g. already-in-view on load).
export function Reveal({ children, delay = 0, y = 28, className, style, id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.opacity = '0';
    el.style.transform = `translateY(${y}px)`;
    el.style.transition = `opacity 0.8s ${ease} ${delay}s, transform 0.8s ${ease} ${delay}s`;
    el.style.willChange = 'opacity, transform';

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      el.style.opacity = '1';
      el.style.transform = 'none';
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);

    const safety = window.setTimeout(reveal, 1300);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [delay, y]);

  return (
    <div ref={ref} className={className} style={style} id={id}>
      {children}
    </div>
  );
}
