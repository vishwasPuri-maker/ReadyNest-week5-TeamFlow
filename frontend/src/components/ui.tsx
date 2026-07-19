'use client';

import clsx from 'clsx';
import { ReactNode } from 'react';
import type { TaskPriority, TaskStatus } from '@/lib/types';

// Monochrome intensity ramp (Design.md): light → mid → solid ink.
const statusStyles: Record<TaskStatus, string> = {
  TODO: 'bg-paper text-slate ring-1 ring-silver',
  IN_PROGRESS: 'bg-silver text-graphite',
  DONE: 'bg-ink text-white',
};
const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={clsx('badge', statusStyles[status])}>{statusLabels[status]}</span>;
}

const priorityStyles: Record<TaskPriority, string> = {
  LOW: 'bg-paper text-slate ring-1 ring-silver',
  MEDIUM: 'bg-silver text-graphite',
  HIGH: 'bg-graphite text-white',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={clsx('badge', priorityStyles[priority])}>{priority}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="card flex flex-col items-center justify-center py-14 text-center text-gray-400">
      <span className="mb-2 text-3xl">📭</span>
      {message}
    </div>
  );
}
