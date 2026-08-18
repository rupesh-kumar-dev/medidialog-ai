import { z } from "zod";

export const testStatusValues = ["normal", "borderline", "high", "low", "unknown"] as const;
export type TestStatus = (typeof testStatusValues)[number];

export const labTestSchema = z.object({
  name: z.string(),
  result: z.string().default(""),
  unit: z.string().default(""),
  reference_range: z.string().default(""),
  reference_source: z.enum(["report", "general", "none"]).default("none"),
  status: z.string().default("unknown"),
  explanation: z.string().default(""),
});

export const reportAnalysisSchema = z.object({
  readable: z.boolean().default(false),
  unreadable_reason: z.string().default(""),
  document_type: z.string().default("other"),
  title: z.string().default(""),
  lab_name: z.string().default(""),
  report_date: z.string().default(""),
  tests: z.array(labTestSchema).default([]),
  summary: z.string().default(""),
  abnormal_findings: z.array(z.string()).default([]),
  interpretation: z.string().default(""),
  image_review: z
    .object({
      quality: z.string().default(""),
      appears_to_be: z.string().default(""),
      observations: z.array(z.string()).default([]),
      caution: z.string().default(""),
    })
    .optional(),
  questions_for_doctor: z.array(z.string()).default([]),
  next_step: z.string().default(""),
  warning_signs: z.array(z.string()).default([]),
});

export type LabTest = z.infer<typeof labTestSchema>;
export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>;

export function normaliseStatus(raw: string): TestStatus {
  const v = (raw || "").toLowerCase();
  if (v.includes("border")) return "borderline";
  if (v.includes("high") || v.includes("above")) return "high";
  if (v.includes("low") || v.includes("below")) return "low";
  if (v.includes("normal") || v.includes("within")) return "normal";
  return "unknown";
}

export const statusMeta: Record<TestStatus, { label: string; dot: string; className: string }> = {
  normal: {
    label: "Within reference range",
    dot: "🟢",
    className: "bg-success-soft text-success",
  },
  borderline: {
    label: "Borderline / needs context",
    dot: "🟡",
    className: "bg-warning-soft text-warning-foreground",
  },
  high: { label: "Above reference range", dot: "🔴", className: "bg-danger-soft text-danger" },
  low: { label: "Below reference range", dot: "🔴", className: "bg-danger-soft text-danger" },
  unknown: { label: "Unable to determine", dot: "⚪", className: "bg-muted text-muted-foreground" },
};

export function numericResult(value: string): number | null {
  const match = (value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}
