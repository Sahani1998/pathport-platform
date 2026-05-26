export default function InstitutionCoursesLoading() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between">
        <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.06] animate-pulse" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />)}
      </div>
      <div className="h-64 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
    </div>
  );
}
