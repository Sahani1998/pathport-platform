import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export default function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  return (
    <Link
      href="/trust/institution-verification"
      title="PathPort has verified this institution's CPE registration, Student Pass eligibility, contact information, and signed a platform agreement. Click to learn more."
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-body font-semibold transition-colors",
        "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20",
        size === "sm"  && "px-2 py-0.5 text-[10px]",
        size === "md"  && "px-2.5 py-1 text-xs",
        className
      )}
    >
      <CheckCircle className={cn("flex-shrink-0", size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
      Verified Institution
    </Link>
  );
}
