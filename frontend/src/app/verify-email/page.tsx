'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type State = 'loading' | 'success' | 'error';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>('loading');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard against double-invoke in strict mode
    ran.current = true;
    if (!token) {
      setState('error');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => setState('success'))
      .catch(() => setState('error'));
  }, [token]);

  if (state === 'loading') {
    return <p className="text-gray-400">Verifying your email…</p>;
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✅</div>
        <h1 className="mb-1 text-xl font-bold">Email verified!</h1>
        <p className="mb-6 text-sm text-gray-500">Your account is now fully activated.</p>
        <Link href="/dashboard" className="btn-primary w-full">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">⚠️</div>
      <h1 className="mb-1 text-xl font-bold">Verification failed</h1>
      <p className="mb-6 text-sm text-gray-500">This link is invalid or has expired. Sign in and request a new one.</p>
      <Link href="/login" className="btn-primary w-full">Back to sign in</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
