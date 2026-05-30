export default function InstitutionDashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse">
      <div className="h-44 rounded-2xl bg-white/[0.04]" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 h-56 rounded-2xl bg-white/[0.04]" />
        <div className="lg:col-span-3 h-56 rounded-2xl bg-white/[0.04]" />
      </div>
      <div className="h-48 rounded-2xl bg-white/[0.04]" />
    </div>
  );
}
