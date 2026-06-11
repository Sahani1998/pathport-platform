import type { DocumentStatus } from "@/types/documents";
import { DOCUMENT_STATUS_META } from "@/types/documents";
import { CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";

interface DocumentStatusBadgeProps {
  status:           DocumentStatus;
  rejectionReason?: string | null;
  showReason?:      boolean;
}

const ICONS: Record<DocumentStatus, React.ElementType> = {
  pending:           Clock,
  verified:          CheckCircle2,
  rejected:          XCircle,
  reupload_required: RefreshCw,
};

export default function DocumentStatusBadge({
  status,
  rejectionReason,
  showReason = false,
}: DocumentStatusBadgeProps) {
  const meta = DOCUMENT_STATUS_META[status];
  const Icon = ICONS[status];

  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-body text-xs font-semibold ${meta.color}`}>
        <Icon className="w-3 h-3 flex-shrink-0" />
        {meta.label}
      </span>
      {showReason && (status === "rejected" || status === "reupload_required") && rejectionReason && (
        <p className="text-orange-400/80 font-body text-xs pl-1 leading-relaxed">
          {rejectionReason}
        </p>
      )}
    </div>
  );
}
