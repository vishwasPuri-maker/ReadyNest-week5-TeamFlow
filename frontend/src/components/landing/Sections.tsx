'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- bespoke feature visuals (monochrome) ---------- */

function IsolationVisual() {
  const org = (name: string, tag: string) => (
    <div style={{ background: 'var(--paper)', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--graphite)' }}>{name}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--slate)', background: 'var(--white)', padding: '2px 9px', borderRadius: 9999, letterSpacing: '0.05em' }}>{tag}</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--white)' }} />
          <span style={{ height: 7, borderRadius: 4, background: 'var(--silver)', flex: 1, maxWidth: `${70 - i * 12}%` }} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="panel">
      <div style={{ display: 'grid', gap: 12 }}>
        {org('Acme Inc', 'TENANT A')}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: 'var(--slate)' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--silver)' }} />
          <span className="mono" style={{ fontSize: 11, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 10V8a6 6 0 1112 0v2m-13 0h14v10H5V10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            isolated — no shared rows
          </span>
          <span style={{ flex: 1, height: 1, background: 'var(--silver)' }} />
        </div>
        {org('Globex Corp', 'TENANT B')}
      </div>
    </div>
  );
}

function RealtimeVisual() {
  const cols: [string, string[]][] = [
    ['To do', ['Set up CI']],
    ['In progress', ['Design board', 'Wire sockets']],
    ['Done', ['Auth flow']],
  ];
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--graphite)' }}>Board · Website Redesign</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex' }}>
            {['A', 'B', 'C'].map((a, i) => (
              <span key={a} style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--paper)', color: 'var(--graphite)', fontSize: 10, fontWeight: 500, display: 'grid', placeItems: 'center', border: '2px solid var(--white)', marginLeft: i ? -7 : 0 }}>{a}</span>
            ))}
          </span>
          <span className="mono live-pulse" style={{ fontSize: 11, color: 'var(--blue)' }}>● live</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {cols.map(([name, items]) => (
          <div key={name} style={{ background: 'var(--paper)', borderRadius: 10, padding: 9, minHeight: 128 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--slate)', marginBottom: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{name}</div>
            {items.map((it, idx) => (
              <div key={it} style={{ background: 'var(--white)', borderRadius: 8, padding: '8px 9px', fontSize: 12, fontWeight: 400, color: 'var(--graphite)', marginBottom: 7, boxShadow: name === 'In progress' && idx === 0 ? '0 0 0 1.5px var(--ink)' : 'var(--shadow-card)' }}>
                {it}
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes lp { 0%,100%{opacity:1} 50%{opacity:.3} }
        .live-pulse { animation: lp 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .live-pulse{ animation:none } }
      `}</style>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [64, 40, 82];
  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'conic-gradient(#101010 0 240deg, #e5e7eb 240deg 360deg)' }} />
          <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', background: 'var(--white)', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--graphite)' }}>67%</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>done</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['Low', 'Medium', 'High'].map((k, i) => (
            <div key={k}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span className="mono" style={{ color: 'var(--slate)' }}>{k}</span>
              </div>
              <div style={{ height: 8, borderRadius: 9999, background: 'var(--paper)' }}>
                <div style={{ height: '100%', width: `${bars[i]}%`, borderRadius: 9999, background: 'var(--ink)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const caps = [
  { tag: 'access', h: 'Role-based access', p: 'Admins own structure; members work the board. Enforced server-side, not just hidden in the UI.' },
  { tag: 'trail', h: 'Full audit log', p: 'Every create, update and delete is recorded with who, what and when — per organization.' },
  { tag: 'auth', h: 'Complete auth', p: 'JWT + rotating refresh tokens, email verification, and password reset out of the box.' },
  { tag: 'files', h: 'File attachments', p: 'Attach files to any task, stored per-tenant on Cloudinary with a 5MB guard.' },
  { tag: 'query', h: 'Search · filter · sort', p: 'Every list is paginated and query-driven — filter by status, priority, project or assignee.' },
  { tag: 'live', h: 'Realtime sockets', p: 'Socket.io rooms scoped per organization, so updates never leak across tenants.' },
];

export function Features() {
  return (
    <section id="features" className="sec">
      <div className="shell">
        <Reveal className="sec-head">
          <h2>Everything a team needs to run work — and nothing it doesn&apos;t.</h2>
          <p>Each capability is real and shipping today. Here&apos;s what the product actually does.</p>
        </Reveal>

        <div style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)' }}>
          <div className="feat">
            <Reveal className="feat-copy">
              <p className="feat-kick">01 · Multi-tenancy</p>
              <h3>Every organization gets its own isolated space.</h3>
              <p>One database, strict tenant scoping. A user in Acme can never read or write a single row that belongs to Globex — verified end to end.</p>
              <ul>
                <li><Check /> Organization-scoped on every query</li>
                <li><Check /> Per-tenant realtime and file storage</li>
                <li><Check /> Switch orgs without leaking data</li>
              </ul>
            </Reveal>
            <Reveal className="feat-media" delay={0.08}><IsolationVisual /></Reveal>
          </div>

          <div className="feat rev">
            <Reveal className="feat-copy">
              <p className="feat-kick">02 · Realtime</p>
              <h3>The board updates the instant someone moves a task.</h3>
              <p>Socket.io pushes every change to everyone in the organization — no refresh, no polling. Presence and live status come standard.</p>
              <ul>
                <li><Check /> Create, update, delete broadcast live</li>
                <li><Check /> Rooms scoped per tenant</li>
                <li><Check /> Optimistic, sub-frame updates</li>
              </ul>
            </Reveal>
            <Reveal className="feat-media" delay={0.08}><RealtimeVisual /></Reveal>
          </div>

          <div className="feat">
            <Reveal className="feat-copy">
              <p className="feat-kick">03 · Analytics</p>
              <h3>Know where the work stands at a glance.</h3>
              <p>A live dashboard breaks down tasks by status and priority, tracks completion rate, and flags what&apos;s overdue — per organization.</p>
              <ul>
                <li><Check /> Status &amp; priority breakdowns</li>
                <li><Check /> Completion rate &amp; overdue count</li>
                <li><Check /> Recomputed on every change</li>
              </ul>
            </Reveal>
            <Reveal className="feat-media" delay={0.08}><AnalyticsVisual /></Reveal>
          </div>
        </div>

        <div className="caps" style={{ marginTop: 'clamp(3.5rem, 7vw, 6rem)' }}>
          {caps.map((c, i) => (
            <Reveal key={c.h} className="cap" delay={(i % 3) * 0.06}>
              <span className="cap-tag">{c.tag}</span>
              <h4>{c.h}</h4>
              <p>{c.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: '1', h: 'Create your workspace', p: 'Sign up and your organization is provisioned instantly. You become its admin — no setup call, no waiting.' },
    { n: '2', h: 'Invite your team', p: 'Add members with a role. Admins shape projects and permissions; members get straight to the board.' },
    { n: '3', h: 'Ship the work', p: 'Create projects and tasks, assign, attach files, and watch progress update live across the whole team.' },
  ];
  return (
    <section id="how" className="sec" style={{ background: 'var(--white)' }}>
      <div className="shell">
        <Reveal className="sec-head">
          <h2>From zero to shipping in three steps.</h2>
        </Reveal>
        <div className="steps" style={{ marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} className="step" delay={i * 0.08}>
              <span className="step-n">{s.n}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Security() {
  const items = [
    { b: 'Tenant isolation', s: 'Every row is org-scoped; cross-tenant reads are impossible by construction.' },
    { b: 'JWT + refresh', s: 'Short-lived access tokens with rotating, revocable refresh tokens.' },
    { b: 'Verified email', s: 'Signup verification and secure, single-use password reset links.' },
    { b: 'Hardened API', s: 'Helmet, CORS, per-route rate limiting and schema validation on every input.' },
  ];
  return (
    <section id="security" className="sec">
      <div className="shell">
        <Reveal>
          <div className="band">
            <div style={{ maxWidth: 640 }}>
              <p className="label" style={{ color: 'var(--blue)', marginBottom: 14 }}>Security</p>
              <h2>Built like production software, because it is.</h2>
              <p>Security isn&apos;t a page in the docs — it&apos;s enforced in the code. Isolation, auth, and rate limiting are part of every request.</p>
            </div>
            <div className="sec-grid">
              {items.map((it) => (
                <div key={it.b} className="sitem">
                  <b>{it.b}</b>
                  <span>{it.s}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="cta">
      <div className="shell">
        <Reveal>
          <h2>Give your team one place to work.</h2>
          <p>Create a workspace in seconds. Free to start — no credit card.</p>
          <div style={{ marginTop: 30, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="l-btn l-btn-primary">Start free</Link>
            <Link href="/login" className="l-btn l-btn-ghost">Open the demo →</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="shell foot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--graphite)' }}>
          <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--ink)', color: 'var(--white)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 14 }}>T</span>
          TeamFlow
        </div>
        <div style={{ display: 'flex', gap: 22 }}>
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Start free</Link>
        </div>
        <span style={{ fontSize: 13, color: 'var(--slate)' }}>© {new Date().getFullYear()} TeamFlow</span>
      </div>
    </footer>
  );
}
