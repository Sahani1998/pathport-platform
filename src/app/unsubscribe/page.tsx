import type { Metadata } from "next";
import UnsubscribeClient from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe — PathPort",
  description: "Stop receiving emails from PathPort.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0D1530] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 md:p-10">
        <h1 className="font-display text-3xl text-white mb-3">Unsubscribe</h1>
        <UnsubscribeClient token={token ?? null} emailHint={email ?? null} />
      </div>
    </main>
  );
}
