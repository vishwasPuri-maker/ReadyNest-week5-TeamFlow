'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Pagination } from '@/components/Pagination';
import { Empty, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { Activity, PageMeta } from '@/lib/types';

const actionIcons: Record<string, string> = {
  created: '➕',
  updated: '✏️',
  deleted: '🗑️',
  added: '👤',
  removed: '🚪',
  role_changed: '🔑',
};

function iconFor(action: string) {
  const key = action.split('.')[1] ?? '';
  return actionIcons[key] ?? '•';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['activity', page],
    queryFn: async () =>
      (await api.get<{ data: Activity[]; meta: PageMeta }>('/analytics/activity', {
        params: { page, limit: 20 },
      })).data,
  });

  return (
    <AppShell>
      <PageHeader title="Activity Log" subtitle="Audit trail of everything in your organization" />

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !data?.data.length ? (
        <Empty message="No activity recorded yet." />
      ) : (
        <div className="card divide-y divide-gray-50 p-0">
          {data.data.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{iconFor(a.action)}</span>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{a.user?.name ?? 'System'}</span>{' '}
                  <span className="text-gray-500">{a.action.replace('.', ' ')}</span>
                  {!!a.metadata?.name && <span className="text-gray-700"> “{String(a.metadata.name)}”</span>}
                  {!!a.metadata?.title && <span className="text-gray-700"> “{String(a.metadata.title)}”</span>}
                </p>
              </div>
              <span className="text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onChange={setPage} />}
    </AppShell>
  );
}
