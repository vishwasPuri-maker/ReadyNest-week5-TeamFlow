'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { AppShell } from '@/components/AppShell';
import { Modal, PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Member, Role } from '@/lib/types';

export default function MembersPage() {
  const { organization, user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = organization?.role === 'ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' as Role });

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<{ data: Member[] }>('/members', { params: { limit: 100 } })).data.data,
  });

  const invite = useMutation({
    mutationFn: () => api.post('/members', form),
    onSuccess: () => {
      toast.success('Member added');
      qc.invalidateQueries({ queryKey: ['members'] });
      setModalOpen(false);
      setForm({ name: '', email: '', password: '', role: 'MEMBER' });
    },
    onError: (e) => toast.error((e as AxiosError<{ message: string }>).response?.data?.message ?? 'Failed'),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => api.patch(`/members/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e) => toast.error((e as AxiosError<{ message: string }>).response?.data?.message ?? 'Failed'),
  });

  const removeMember = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => {
      toast.success('Member removed');
      qc.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (e) => toast.error((e as AxiosError<{ message: string }>).response?.data?.message ?? 'Failed'),
  });

  return (
    <AppShell>
      <PageHeader
        title="Members"
        subtitle="People in your organization"
        action={isAdmin ? <button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add member</button> : undefined}
      />

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {data?.map((m) => (
                <tr key={m.membershipId} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {m.name} {m.id === user?.id && <span className="text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.email}</td>
                  <td className="px-4 py-3">
                    {isAdmin && m.id !== user?.id ? (
                      <select
                        className="input w-auto py-1"
                        value={m.role}
                        onChange={(e) => changeRole.mutate({ id: m.membershipId, role: e.target.value as Role })}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    ) : (
                      <span className="badge bg-brand-50 text-brand-700">{m.role}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {m.id !== user?.id && (
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => confirm(`Remove ${m.name}?`) && removeMember.mutate(m.membershipId)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add member">
        <div className="space-y-3">
          <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className="btn-primary"
              disabled={!form.name || !form.email || form.password.length < 6 || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? 'Adding…' : 'Add member'}
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
