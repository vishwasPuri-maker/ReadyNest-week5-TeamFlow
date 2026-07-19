'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { Pagination } from '@/components/Pagination';
import { Empty, Modal, PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { PageMeta, Project } from '@/lib/types';

export default function ProjectsPage() {
  const { organization } = useAuth();
  const qc = useQueryClient();
  const isAdmin = organization?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, page],
    queryFn: async () =>
      (await api.get<{ data: Project[]; meta: PageMeta }>('/projects', {
        params: { search, page, limit: 9 },
      })).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return api.patch(`/projects/${editing.id}`, form);
      return api.post('/projects', form);
    },
    onSuccess: () => {
      toast.success(editing ? 'Project updated' : 'Project created');
      qc.invalidateQueries({ queryKey: ['projects'] });
      closeModal();
    },
    onError: () => toast.error('Something went wrong'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Project deleted');
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.error('Delete failed (admins only)'),
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  }
  function openEdit(p: Project) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '' });
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  return (
    <AppShell>
      <PageHeader
        title="Projects"
        subtitle="Group tasks into projects"
        action={<button className="btn-primary" onClick={openCreate}>+ New project</button>}
      />

      <input
        className="input mb-4 max-w-xs"
        placeholder="Search projects…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : !data?.data.length ? (
        <Empty message="No projects yet. Create your first one." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((p) => (
            <div key={p.id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="badge bg-brand-50 text-brand-700">{p._count?.tasks ?? 0} tasks</span>
              </div>
              <p className="mt-2 flex-1 text-sm text-gray-500">{p.description || 'No description'}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-ghost flex-1" onClick={() => openEdit(p)}>Edit</button>
                {isAdmin && (
                  <button
                    className="btn-danger"
                    onClick={() => confirm(`Delete "${p.name}"?`) && remove.mutate(p.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <Pagination meta={data.meta} onChange={setPage} />
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit project' : 'New project'}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" disabled={!form.name || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
