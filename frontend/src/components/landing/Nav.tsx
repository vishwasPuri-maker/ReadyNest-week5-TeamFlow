'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#security', label: 'Security' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${scrolled ? 'var(--silver)' : 'transparent'}`,
        background: scrolled ? 'rgba(244,244,244,0.82)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(1.3) blur(10px)' : 'none',
        transition: 'background .25s, border-color .25s',
      }}
    >
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--graphite)' }}>
          <span
            style={{
              width: 26, height: 26, borderRadius: 7, background: 'var(--ink)',
              color: 'var(--white)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 15,
            }}
          >
            T
          </span>
          TeamFlow
        </Link>

        <nav style={{ display: 'flex', gap: 30 }} className="nav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{ fontSize: 15, color: 'var(--slate)', fontWeight: 400 }} className="nav-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ fontSize: 15, fontWeight: 500, color: 'var(--graphite)' }} className="nav-signin">
            Sign in
          </Link>
          {/* Header CTA is rectangular (8px) per Design.md */}
          <Link
            href="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', height: 38, padding: '0 16px',
              borderRadius: 8, background: 'var(--ink)', color: 'var(--white)', fontSize: 14, fontWeight: 500,
              boxShadow: 'var(--shadow-btn)', transition: 'background .16s, transform .16s',
            }}
            className="nav-cta"
          >
            Start free
          </Link>
        </div>
      </div>

      <style>{`
        .nav-link:hover { color: var(--graphite); }
        .nav-cta:hover { background: #000; transform: translateY(-1px); }
        @media (max-width: 760px) {
          .nav-links { display: none !important; }
          .nav-signin { display: none !important; }
        }
      `}</style>
    </header>
  );
}
