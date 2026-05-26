export default function CoursesLoading() {
  return (
    <div className="max-w-7xl space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-48 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-white/[0.04] animate-pulse" />
      </div>
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 rounded-xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
