export default function CourseDetailLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="h-4 w-32 rounded-lg bg-white/[0.05] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
          <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}
