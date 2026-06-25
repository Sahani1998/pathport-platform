"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    router.refresh();
    // router.refresh() has no Promise to await; reset after a short visual delay.
    setTimeout(() => setSpinning(false), 1200);
  };

  return (
    <button
      onClick={handleClick}
      disabled={spinning}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 hover:text-white/80 hover:border-white/20 font-body text-sm transition-all disabled:opacity-50"
    >
      <RefreshCw className={cn("w-3.5 h-3.5", spinning && "animate-spin")} />
      {spinning ? "Refreshing…" : "Refresh"}
    </button>
  );
}
