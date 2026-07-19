'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

interface Dashboard {
  totals: { projects: number; tasks: number; members: number; overdue: number };
  tasksByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  tasksByPriority: { LOW: number; MEDIUM: number; HIGH: number };
  completionRate: number;
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ?? ''}`}>{value}</p>
    </div>
  );
}

// Monochrome ramp: To do (ink) → In progress (slate) → Done (silver)
const STATUS_COLORS = ['#101010', '#6b7280', '#e5e7eb'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<{ data: Dashboard }>('/analytics/dashboard')).data.data,
  });

  return (
    <AppShell>
      <PageHeader title="Dashboard" subtitle="Overview of your organization" />

      {isLoading || !data ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Projects" value={data.totals.projects} />
            <Stat label="Tasks" value={data.totals.tasks} />
            <Stat label="Members" value={data.totals.members} />
            <Stat label="Overdue" value={data.totals.overdue} accent="text-ink" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-4 font-semibold">Tasks by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'To Do', value: data.tasksByStatus.TODO },
                        { name: 'In Progress', value: data.tasksByStatus.IN_PROGRESS },
                        { name: 'Done', value: data.tasksByStatus.DONE },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      label
                    >
                      {STATUS_COLORS.map((c) => (
                        <Cell key={c} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm text-gray-500">
                Completion rate: <span className="font-semibold text-ink">{data.completionRate}%</span>
              </p>
            </div>

            <div className="card">
              <h3 className="mb-4 font-semibold">Tasks by Priority</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Low', value: data.tasksByPriority.LOW },
                      { name: 'Medium', value: data.tasksByPriority.MEDIUM },
                      { name: 'High', value: data.tasksByPriority.HIGH },
                    ]}
                  >
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f4f4f4' }} />
                    <Bar dataKey="value" fill="#101010" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
