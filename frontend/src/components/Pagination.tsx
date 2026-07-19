'use client';

import type { PageMeta } from '@/lib/types';

export function Pagination({ meta, onChange }: { meta: PageMeta; onChange: (p: number) => void }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button className="btn-ghost" disabled={!meta.hasPrev} onClick={() => onChange(meta.page - 1)}>
        Prev
      </button>
      <span className="text-sm text-gray-500">
        Page {meta.page} of {meta.totalPages}
      </span>
      <button className="btn-ghost" disabled={!meta.hasNext} onClick={() => onChange(meta.page + 1)}>
        Next
      </button>
    </div>
  );
}
