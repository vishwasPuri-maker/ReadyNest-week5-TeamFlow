'use client';

// High-fidelity, honest render of the actual TeamFlow UI — used as the hero
// "screenshot". Pure CSS/markup so it stays crisp at any DPI (no raster asset).

const donut = () => {
  // TODO/IN_PROGRESS/DONE as a monochrome ramp (ink → slate → silver)
  const a = 122; // todo
  const b = 118; // in progress
  return `conic-gradient(
    #101010 0 ${a}deg,
    #6b7280 ${a}deg ${a + b}deg,
    #e5e7eb ${a + b}deg 360deg
  )`;
};

const rows = [
  { t: 'Design system audit', who: 'AP', pr: 'HIGH', prc: 'var(--graphite)', st: 'In progress', sc: 'var(--slate)' },
  { t: 'Ship real-time board', who: 'BM', pr: 'HIGH', prc: 'var(--graphite)', st: 'To do', sc: 'var(--stone)' },
  { t: 'Tenant isolation tests', who: 'CV', pr: 'MED', prc: 'var(--slate)', st: 'Done', sc: 'var(--ink)' },
  { t: 'Invite flow + roles', who: 'AP', pr: 'LOW', prc: 'var(--slate)', st: 'In progress', sc: 'var(--slate)' },
];

export function ProductMock() {
  return (
    <div className="mock" aria-hidden="true">
      <div className="mock-bar">
        <span className="dot" style={{ background: '#d1d5db' }} />
        <span className="dot" style={{ background: '#d1d5db' }} />
        <span className="dot" style={{ background: '#d1d5db' }} />
        <span className="mock-url mono">app.teamflow.io/dashboard</span>
      </div>

      <div className="mock-body">
        <aside className="mock-side">
          <div className="mock-brand">
            <span className="mock-logo">T</span>
            <b>TeamFlow</b>
          </div>
          {['Dashboard', 'Projects', 'Tasks', 'Members', 'Activity'].map((n, i) => (
            <span key={n} className={`mock-nav ${i === 0 ? 'is-active' : ''}`}>
              {n}
            </span>
          ))}
          <div className="mock-org mono">ACME&nbsp;INC · ADMIN</div>
        </aside>

        <main className="mock-main">
          <div className="mock-stats">
            {[
              { k: 'Tasks', v: '48' },
              { k: 'Projects', v: '7' },
              { k: 'Members', v: '12' },
              { k: 'Overdue', v: '2' },
            ].map((s) => (
              <div key={s.k} className="mock-stat">
                <span className="mono mock-stat-k">{s.k}</span>
                <span className="mock-stat-v">{s.v}</span>
              </div>
            ))}
          </div>

          <div className="mock-grid">
            <div className="mock-card">
              <div className="mock-card-h">
                <span>Tasks by status</span>
                <span className="mono mock-pill">67% done</span>
              </div>
              <div className="mock-donut-wrap">
                <div className="mock-donut" style={{ background: donut() }}>
                  <div className="mock-donut-hole" />
                </div>
                <ul className="mock-legend mono">
                  <li><i style={{ background: '#101010' }} />To do</li>
                  <li><i style={{ background: '#6b7280' }} />In progress</li>
                  <li><i style={{ background: '#e5e7eb' }} />Done</li>
                </ul>
              </div>
            </div>

            <div className="mock-card">
              <div className="mock-card-h">
                <span>Recent tasks</span>
                <span className="mono mock-live">● live</span>
              </div>
              <table className="mock-table">
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.t}>
                      <td>{r.t}</td>
                      <td><span className="mock-avatar">{r.who}</span></td>
                      <td><span className="mono mock-tag" style={{ color: r.prc }}>{r.pr}</span></td>
                      <td><span className="mono" style={{ color: r.sc }}>{r.st}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
