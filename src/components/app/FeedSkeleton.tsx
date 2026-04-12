'use client'

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      {/* Image placeholder */}
      <div className="mb-4 h-40 w-full animate-pulse rounded-lg bg-[var(--surface)]" />
      {/* Headline */}
      <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
      {/* Synthesis */}
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-4 h-4 w-5/6 animate-pulse rounded bg-[var(--surface)]" />
      {/* Meta row */}
      <div className="flex items-center gap-3">
        <div className="h-3 w-20 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-5 w-14 animate-pulse rounded-full bg-[var(--surface)]" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--surface)]" />
      </div>
    </div>
  )
}

export default function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
