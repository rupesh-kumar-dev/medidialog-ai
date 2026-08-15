import { Info } from "lucide-react";

import { DISCLAIMER_TEXT } from "@/lib/health-data";
import { cn } from "@/lib/utils";

export function MedicalDisclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-xl border border-border bg-muted/60 p-4 text-muted-foreground",
        compact ? "text-xs" : "text-sm",
        className,
      )}
      aria-label="Medical disclaimer"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p>{DISCLAIMER_TEXT}</p>
    </aside>
  );
}
