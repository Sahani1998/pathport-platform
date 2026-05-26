export default function ApplicationsLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-44 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
      ))}
    </div>
  );
}
