'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [busy, setBusy] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success('Organization created!');
      router.replace('/dashboard');
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>).response?.data?.message ?? 'Registration failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold">Create your workspace</h1>
        <p className="mb-6 text-sm text-gray-500">You&apos;ll be the admin of a brand-new organization.</p>

        <label className="mb-1 block text-sm font-medium">Your name</label>
        <input className="input mb-4" value={form.name} onChange={update('name')} required />

        <label className="mb-1 block text-sm font-medium">Organization name</label>
        <input className="input mb-4" value={form.organizationName} onChange={update('organizationName')} required />

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input className="input mb-4" type="email" value={form.email} onChange={update('email')} required />

        <label className="mb-1 block text-sm font-medium">Password</label>
        <input className="input mb-6" type="password" minLength={6} value={form.password} onChange={update('password')} required />

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create workspace'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
