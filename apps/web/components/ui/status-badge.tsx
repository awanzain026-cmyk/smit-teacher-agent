import type { DocumentStatus } from "@smit/shared";
import { Badge } from "./badge";

const STATUS_CONFIG: Record<DocumentStatus, { label: string; variant: "success" | "warning" | "destructive" | "secondary" | "default" }> = {
  READY: { label: "Ready", variant: "success" },
  PENDING: { label: "Queued", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "warning" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}
