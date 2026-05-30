export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse">
      <div className="h-44 rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-2xl bg-white/[0.04]" />
          <div className="h-48 rounded-2xl bg-white/[0.04]" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
