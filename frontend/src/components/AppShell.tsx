'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import clsx from 'clsx';
import { ReactElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { VerifyBanner } from './VerifyBanner';

const I = (d: ReactElement) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const icons: Record<string, ReactElement> = {
  dashboard: I(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  projects: I(<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />),
  tasks: I(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>),
  members: I(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0" /><path d="M16 5.2a3.2 3.2 0 010 5.6M17.5 20a5.5 5.5 0 00-2.5-4.6" /></>),
  activity: I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
};

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/projects', label: 'Projects', icon: 'projects' },
  { href: '/tasks', label: 'Tasks', icon: 'tasks' },
  { href: '/members', label: 'Members', icon: 'members' },
  { href: '/activity', label: 'Activity', icon: 'activity' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, organization, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">T</div>
          <div>
            <p className="text-sm font-semibold">TeamFlow</p>
            <p className="text-xs text-gray-400">{organization?.name}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-paper text-ink'
                  : 'text-slate hover:bg-paper hover:text-graphite',
              )}
            >
              <span className="shrink-0">{icons[item.icon]}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 px-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">
              {user.email} · <span className="font-medium text-brand-600">{organization?.role}</span>
            </p>
          </div>
          <button onClick={() => logout().then(() => router.replace('/login'))} className="btn-ghost w-full">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <VerifyBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
