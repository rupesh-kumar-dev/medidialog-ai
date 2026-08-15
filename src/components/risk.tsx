import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type RiskLevel = "low" | "moderate" | "urgent";

export const RISK_META: Record<
  RiskLevel,
  { label: string; blurb: string; detail: string; classes: string; Icon: typeof ShieldCheck }
> = {
  low: {
    label: "Low Risk",
    blurb: "General monitoring and appropriate self-care information.",
    detail:
      "The information you shared does not currently point to features that commonly need urgent evaluation. Keep monitoring how you feel, rest and hydrate, and contact a healthcare professional if anything changes or persists.",
    classes: "bg-success-soft text-success border-success/30",
    Icon: ShieldCheck,
  },
  moderate: {
    label: "Moderate Risk",
    blurb: "Consider contacting a healthcare professional, especially if symptoms persist.",
    detail:
      "Some of the details you shared may benefit from a professional review, particularly if symptoms continue, worsen, or start interfering with daily activity. Booking an appointment is a reasonable next step.",
    classes: "bg-warning-soft text-warning-foreground border-warning/40",
    Icon: ShieldAlert,
  },
  urgent: {
    label: "Urgent Attention",
    blurb: "Prompt professional medical evaluation may be necessary.",
    detail:
      "Some reported symptoms are of a type that can be associated with conditions needing prompt evaluation. This is not a diagnosis, but please contact your local emergency medical services or attend the nearest emergency department without delay.",
    classes: "bg-danger-soft text-danger border-danger/40",
    Icon: AlertTriangle,
  },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        meta.classes,
        className,
      )}
    >
      <meta.Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function RiskCard({ level, explanation }: { level: RiskLevel; explanation?: string }) {
  const meta = RISK_META[level];
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-2xl border p-5", meta.classes)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <meta.Icon className="h-6 w-6" aria-hidden="true" />
          <div>
            <p className="text-lg font-semibold">{meta.label}</p>
            <p className="text-sm opacity-90">{meta.blurb}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              Why this risk level?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Why {meta.label.toLowerCase()}?</DialogTitle>
              <DialogDescription>
                A short summary of the factors MediSage AI considered.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>{explanation || meta.detail}</p>
              <p>
                MediSage AI weighs the symptoms you reported, how long they have lasted, their
                severity, and whether any recognised warning signs were mentioned. It does not
                diagnose.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
