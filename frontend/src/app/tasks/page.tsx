'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { Pagination } from '@/components/Pagination';
import { Empty, Modal, PageHeader, PriorityBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { Member, PageMeta, Project, Task, TaskPriority, TaskStatus } from '@/lib/types';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

const emptyForm = {
  title: '',
  description: '',
  projectId: '',
  status: 'TODO' as TaskStatus,
  priority: 'MEDIUM' as TaskPriority,
  dueDate: '',
  assigneeId: '',
  attachmentUrl: '',
};

export default function TasksPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', projectId: '' });
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters, sort, page],
    queryFn: async () =>
      (await api.get<{ data: Task[]; meta: PageMeta }>('/tasks', {
        params: {
          ...filters,
          ...sort,
          page,
          limit: 8,
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          projectId: filters.projectId || undefined,
        },
      })).data,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => (await api.get<{ data: Project[] }>('/projects', { params: { limit: 100 } })).data.data,
  });
  const { data: members } = useQuery({
    queryKey: ['members', 'all'],
    queryFn: async () => (await api.get<{ data: Member[] }>('/members', { params: { limit: 100 } })).data.data,
  });

  // Live updates: any task mutation in this org refreshes the list.
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => qc.invalidateQueries({ queryKey: ['tasks'] });
    socket.on('task:created', refresh);
    socket.on('task:updated', refresh);
    socket.on('task:deleted', refresh);
    return () => {
      socket.off('task:created', refresh);
      socket.off('task:updated', refresh);
      socket.off('task:deleted', refresh);
    };
  }, [qc]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assigneeId: form.assigneeId || null,
        attachmentUrl: form.attachmentUrl || undefined,
        ...(editing ? {} : { projectId: form.projectId }),
      };
      return editing ? api.patch(`/tasks/${editing.id}`, payload) : api.post('/tasks', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Task updated' : 'Task created');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      closeModal();
    },
    onError: () => toast.error('Could not save task'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      toast.success('Task deleted');
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Quick inline status change from the table.
  const quickStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.patch(`/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data: res } = await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, attachmentUrl: res.data.url }));
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed (configure Cloudinary)');
    } finally {
      setUploading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects?.[0]?.id ?? '' });
    setModalOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      projectId: t.projectId,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      assigneeId: t.assigneeId ?? '',
      attachmentUrl: t.attachmentUrl ?? '',
    });
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  return (
    <AppShell>
      <PageHeader
        title="Tasks"
        subtitle="Real-time task board"
        action={
          <button className="btn-primary" onClick={openCreate} disabled={!projects?.length}>
            + New task
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => {
            setFilters({ ...filters, search: e.target.value });
            setPage(1);
          }}
        />
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="input w-auto" value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
          <option value="">All projects</option>
          {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          className="input w-auto"
          value={`${sort.sortBy}:${sort.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(':');
            setSort({ sortBy, sortOrder });
          }}
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="dueDate:asc">Due date ↑</option>
          <option value="priority:desc">Priority</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !data?.data.length ? (
        <Empty message="No tasks match your filters." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">
                    {t.title}
                    {t.attachmentUrl && (
                      <a href={t.attachmentUrl} target="_blank" rel="noreferrer" className="ml-2 text-brand-600">📎</a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.project?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{t.assignee?.name ?? '—'}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border-0 bg-transparent p-0 text-xs"
                      value={t.status}
                      onChange={(e) => quickStatus.mutate({ id: t.id, status: e.target.value as TaskStatus })}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.dueDate ? t.dueDate.slice(0, 10) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-brand-600 hover:underline" onClick={() => openEdit(t)}>Edit</button>
                    <button
                      className="ml-3 text-red-500 hover:underline"
                      onClick={() => confirm('Delete this task?') && remove.mutate(t.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onChange={setPage} />}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit task' : 'New task'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Project</label>
              <select
                className="input"
                value={form.projectId}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Assignee</label>
              <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {members?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Attachment</label>
              <input type="file" className="text-xs" onChange={onUpload} disabled={uploading} />
              {form.attachmentUrl && <span className="text-xs text-green-600">✓ attached</span>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={closeModal}>Cancel</button>
            <button
              className="btn-primary"
              disabled={!form.title || !form.projectId || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Saving…' : 'Save task'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
