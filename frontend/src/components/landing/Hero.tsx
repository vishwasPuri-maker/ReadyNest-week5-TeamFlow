'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { animate, stagger, cubicBezier } from 'animejs';
import { ProductMock } from './ProductMock';
import { CountUp } from './CountUp';

// The hero's on-load choreography is an anime.js timeline: eyebrow → headline
// lines → subcopy → CTAs → the product frame lifting into place.
export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = el.querySelectorAll<HTMLElement>('[data-anim]');

    if (reduce) {
      targets.forEach((t) => {
        t.style.opacity = '1';
        t.style.transform = 'none';
      });
      return;
    }

    const revealAll = () =>
      targets.forEach((t) => {
        t.style.opacity = '1';
        t.style.transform = 'none';
      });

    try {
      // Set the "from" state via JS so SSR/no-JS renders fully visible.
      targets.forEach((t) => {
        t.style.opacity = '0';
        t.style.transform = t.dataset.anim === 'frame' ? 'translateY(28px) scale(0.985)' : 'translateY(20px)';
      });

      const ease = cubicBezier(0.16, 1, 0.3, 1);
      animate(el.querySelectorAll('[data-anim="line"]'), {
        opacity: [0, 1], translateY: [20, 0], duration: 900, delay: stagger(90, { start: 120 }), ease,
      });
      animate(el.querySelectorAll('[data-anim="fade"]'), {
        opacity: [0, 1], translateY: [16, 0], duration: 800, delay: stagger(90, { start: 460 }), ease,
      });
      animate(el.querySelectorAll('[data-anim="frame"]'), {
        opacity: [0, 1], translateY: [28, 0], scale: [0.985, 1], duration: 1100, delay: 620, ease,
      });

      // Safety: if any element is still hidden after the timeline should have
      // finished, force it visible (guards against a silent anime failure).
      window.setTimeout(revealAll, 2200);
    } catch {
      revealAll();
    }
  }, []);

  return (
    <section ref={root} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* subtle grid backdrop — precision, not decoration-for-decoration */}
      <div aria-hidden style={gridBg} />

      <div className="shell" style={{ paddingTop: 'clamp(3.5rem, 9vw, 7rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)', position: 'relative' }}>
        <p className="label" data-anim="fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, marginBottom: 22 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink)' }} />
          Multi-tenant · real-time · production-ready
        </p>

        <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)', maxWidth: '15ch' }}>
          <span data-anim="line" style={{ display: 'block' }}>One workspace.</span>
          <span data-anim="line" style={{ display: 'block' }}>Every team&apos;s tasks.</span>
        </h1>

        <p
          data-anim="fade"
          style={{ marginTop: 24, fontSize: 'clamp(1.05rem, 2vw, 1.2rem)', color: 'var(--slate)', maxWidth: '46ch', lineHeight: 1.5, fontWeight: 300 }}
        >
          TeamFlow gives each organization its own isolated space — real-time task boards,
          role-based access, analytics, and a full audit trail. Built to ship, not to demo.
        </p>

        <div data-anim="fade" style={{ marginTop: 34, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/register" className="l-btn l-btn-primary">Start free — no card</Link>
          <Link href="/login" className="l-btn l-btn-ghost">Open the demo →</Link>
        </div>

        <div data-anim="fade" style={{ marginTop: 30, display: 'flex', gap: 30, flexWrap: 'wrap' }}>
          {[
            { to: 99.9, suffix: '%', dec: 1, k: 'tenant isolation' },
            { to: 40, suffix: 'ms', dec: 0, k: 'realtime push' },
            { to: 6, suffix: '', dec: 0, k: 'core modules' },
          ].map((s) => (
            <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--graphite)' }}>
                <CountUp to={s.to} suffix={s.suffix} decimals={s.dec} />
              </span>
              <span className="label" style={{ fontSize: 11 }}>{s.k}</span>
            </div>
          ))}
        </div>

        <div data-anim="frame" style={{ marginTop: 'clamp(3rem, 6vw, 4.5rem)' }}>
          <ProductMock />
        </div>
      </div>
    </section>
  );
}

const gridBg: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage:
    'linear-gradient(rgba(36,36,36,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(36,36,36,0.05) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  maskImage: 'radial-gradient(120% 80% at 50% 0%, black 25%, transparent 72%)',
  WebkitMaskImage: 'radial-gradient(120% 80% at 50% 0%, black 25%, transparent 72%)',
  pointerEvents: 'none',
};
