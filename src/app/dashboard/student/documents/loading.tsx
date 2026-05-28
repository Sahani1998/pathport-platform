export default function DocumentsLoading() {
  return (
    <div className="max-w-3xl space-y-4">
      <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="h-4 w-80 rounded-lg bg-white/[0.04] animate-pulse" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-48 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />
      ))}
    </div>
  );
}
