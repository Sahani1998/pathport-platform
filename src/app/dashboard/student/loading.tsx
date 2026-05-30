export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div className="h-40 rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-white/[0.04]" />
        <div className="space-y-4">
          <div className="h-32 rounded-2xl bg-white/[0.04]" />
          <div className="h-32 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
