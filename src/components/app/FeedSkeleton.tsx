'use client'

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
      <div className="mb-5 aspect-[16/7] animate-pulse rounded-lg bg-[var(--surface)]" />
      <div className="mb-3 h-7 w-11/12 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-1.5 h-3 w-20 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-5 h-4 w-4/5 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-5 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-3">
        <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--surface)]" />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-9 animate-pulse rounded-lg bg-[var(--surface)]" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-[var(--surface)]" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-[var(--surface)]" />
        </div>
      </div>
    </div>
  )
}

export default function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <section className="max-w-[680px]">
        <div className="mb-4 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface)]" />
          <div className="h-9 w-36 animate-pulse rounded bg-[var(--surface)]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-h-[154px] animate-pulse rounded-xl bg-[var(--text)]/85" />
          <div className="grid min-h-[154px] gap-3">
            <div className="animate-pulse rounded-xl bg-[var(--surface)]" />
            <div className="animate-pulse rounded-xl bg-[var(--surface)]" />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-[var(--surface)]" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
