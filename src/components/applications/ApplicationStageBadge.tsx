import { getStageMeta } from "@/types/timeline";
import type { ApplicationStage } from "@/types/timeline";
import { cn } from "@/lib/utils";

interface ApplicationStageBadgeProps {
  stage:      ApplicationStage;
  size?:      "sm" | "md";
  showEmoji?: boolean;
  className?: string;
}

export default function ApplicationStageBadge({
  stage,
  size      = "md",
  showEmoji = true,
  className,
}: ApplicationStageBadgeProps) {
  const meta = getStageMeta(stage);
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-body font-semibold",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      meta.color,
      className
    )}>
      {showEmoji && <span>{meta.emoji}</span>}
      {meta.label}
    </span>
  );
}
