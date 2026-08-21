import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reportAnalysisSchema, type ReportAnalysis } from "@/lib/report-schema";

const AnalyzeInput = z.object({
  reportId: z.string().uuid(),
});

const ExplainInput = z.object({
  reportId: z.string().uuid(),
  mode: z.enum(["simple", "detailed", "technical"]),
});

const CompareInput = z.object({
  currentId: z.string().uuid(),
  previousId: z.string().uuid(),
});

const VisitSummaryInput = z.object({
  reportIds: z.array(z.string().uuid()).default([]),
  assessmentIds: z.array(z.string().uuid()).default([]),
  symptoms: z.string().default(""),
});

const ContextInput = z.object({
  reportId: z.string().uuid(),
  previousId: z.string().uuid().optional(),
  symptoms: z.string().default(""),
});

export const analyzeMedicalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(
    async ({ data, context }): Promise<{ ok: boolean; analysis?: ReportAnalysis; error?: string }> => {
      const { supabase } = context;
      const ai = await import("./report-ai.server");
      const { REPORT_SYSTEM_PROMPT } = await import("./ai-gateway.server");

      const { data: row, error } = await supabase
        .from("medical_reports")
        .select("id, file_path, file_type, kind, title")
        .eq("id", data.reportId)
        .maybeSingle();

      if (error || !row || !row.file_path) {
        return { ok: false, error: "We couldn't find that uploaded file." };
      }

      await supabase
        .from("medical_reports")
        .update({ status: "processing", error_message: null })
        .eq("id", data.reportId);

      const download = await supabase.storage.from("medical-reports").download(row.file_path);
      if (download.error || !download.data) {
        return { ok: false, error: "We couldn't read the uploaded file. Please try uploading it again." };
      }

      const buffer = new Uint8Array(await download.data.arrayBuffer());
      if (buffer.byteLength < 2000) {
        return {
          ok: false,
          error: "The file could not be read reliably. Please upload a clearer image or PDF.",
        };
      }

      const mime = row.file_type || "application/pdf";
      const base64 = ai.toBase64(buffer);
      const isPdf = mime.includes("pdf");
      const isImage = mime.startsWith("image/");
      const isMedicalImage = row.kind === "image";

      const instruction = isMedicalImage ? ai.IMAGE_INSTRUCTION : ai.LAB_INSTRUCTION;

      const content: ai.ContentBlock[] = [{ type: "text", text: instruction }];
      if (isPdf) {
        content.push({
          type: "file",
          file: { filename: `${row.title || "report"}.pdf`, file_data: `data:${mime};base64,${base64}` },
        });
      } else if (isImage) {
        content.push({ type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } });
      } else {
        return { ok: false, error: "That file type isn't supported. Please upload a PDF, JPG or PNG." };
      }

      let analysis: ReportAnalysis;
      try {
        const raw = await ai.callGateway(REPORT_SYSTEM_PROMPT, content);
        analysis = reportAnalysisSchema.parse(ai.parseJson(raw));
      } catch (err) {
        const message = err instanceof Error ? err.message : "We couldn't complete the analysis.";
        await supabase
          .from("medical_reports")
          .update({ status: "failed", error_message: message })
          .eq("id", data.reportId);
        return { ok: false, error: message };
      }

      if (!analysis.readable) {
        const message =
          analysis.unreadable_reason ||
          "We couldn't reliably analyze this file. Please upload a clearer image or PDF.";
        await supabase
          .from("medical_reports")
          .update({ status: "unreadable", error_message: message })
          .eq("id", data.reportId);
        return { ok: false, error: message };
      }

      const abnormal = analysis.tests.filter((t) => {
        const s = t.status.toLowerCase();
        return s.includes("high") || s.includes("low") || s.includes("above") || s.includes("below");
      }).length;

      const reportDate = /^\d{4}-\d{2}-\d{2}$/.test(analysis.report_date) ? analysis.report_date : null;

      await supabase
        .from("medical_reports")
        .update({
          status: "complete",
          analysis: JSON.parse(JSON.stringify(analysis)),
          summary: analysis.summary,
          abnormal_count: abnormal,
          lab_name: analysis.lab_name || null,
          report_date: reportDate,
          error_message: null,
          ...(analysis.title ? { title: analysis.title } : {}),
        })
        .eq("id", data.reportId);

      return { ok: true, analysis };
    },
  );

export const explainReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExplainInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    const { data: row } = await context.supabase
      .from("medical_reports")
      .select("title, analysis")
      .eq("id", data.reportId)
      .maybeSingle();

    if (!row?.analysis) return { ok: false, error: "There isn't an analysis to explain yet." };

    const tone =
      data.mode === "simple"
        ? "Explain as if the reader is completely new to medical terms. Very short sentences, no jargon."
        : data.mode === "detailed"
          ? "Explain the medical significance and possible contributing factors in more detail, still in accessible language."
          : "Use accurate medical terminology with a detailed interpretation, as written for a clinically literate reader.";

    try {
      const { callGateway } = await import("./report-ai.server");
      const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const text = await callGateway(MEDISAGE_SYSTEM_PROMPT, [
        {
          type: "text",
          text: `Explain this already-extracted report analysis. ${tone}
The underlying facts must stay identical across explanation levels — never add values, ranges or findings that are not in the data.
Report: ${row.title}
Analysis JSON:
${JSON.stringify(row.analysis)}

Write plain markdown (no JSON). Finish with a one-line reminder that MediSage AI does not replace a qualified healthcare professional.`,
        },
      ]);
      return { ok: true, text };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "We couldn't complete the analysis." };
    }
  });

export const compareReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CompareInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    const { data: rows } = await context.supabase
      .from("medical_reports")
      .select("id, title, created_at, analysis")
      .in("id", [data.currentId, data.previousId]);

    const current = rows?.find((r) => r.id === data.currentId);
    const previous = rows?.find((r) => r.id === data.previousId);
    if (!current?.analysis || !previous?.analysis) {
      return { ok: false, error: "Both reports need a completed analysis before they can be compared." };
    }

    try {
      const { callGateway } = await import("./report-ai.server");
      const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const text = await callGateway(MEDISAGE_SYSTEM_PROMPT, [
        {
          type: "text",
          text: `Compare these two of the user's own laboratory reports and describe what changed.
Only use tests present in both, plus explicitly note newly abnormal values and previously abnormal values now back in range.
Never call a numerical change "improvement" or "deterioration" unless clinically justified; prefer "increased"/"decreased" and note that clinical meaning depends on context.

PREVIOUS (${previous.created_at}):
${JSON.stringify(previous.analysis)}

CURRENT (${current.created_at}):
${JSON.stringify(current.analysis)}

Write short markdown with sections: What changed, Newly outside range, Returned to range, What this may mean, Suggested next step.`,
        },
      ]);
      return { ok: true, text };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "We couldn't complete the analysis." };
    }
  });

export const analyzeWithSymptoms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ContextInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    const ids = [data.reportId, ...(data.previousId ? [data.previousId] : [])];
    const { data: rows } = await context.supabase
      .from("medical_reports")
      .select("id, title, created_at, analysis")
      .in("id", ids);

    const current = rows?.find((r) => r.id === data.reportId);
    if (!current?.analysis) return { ok: false, error: "This report needs a completed analysis first." };
    if (!data.symptoms.trim()) return { ok: false, error: "Please describe your current symptoms." };

    const previous = data.previousId ? rows?.find((r) => r.id === data.previousId) : undefined;

    try {
      const { callGateway } = await import("./report-ai.server");
      const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const text = await callGateway(MEDISAGE_SYSTEM_PROMPT, [
        {
          type: "text",
          text: `Give a contextual summary that considers the user's described symptoms together with their own report findings.
Never state a diagnosis. Make clear that symptoms plus results alone are not sufficient to establish a diagnosis.
Never invent symptoms, values or history.

Symptoms: ${data.symptoms}
Current report: ${JSON.stringify(current.analysis)}
${previous?.analysis ? `Previous report: ${JSON.stringify(previous.analysis)}` : ""}

Write short markdown with sections: How these fit together, What this does not tell us, What to discuss with a doctor, Warning signs to watch for.`,
        },
      ]);
      return { ok: true, text };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "We couldn't complete the analysis." };
    }
  });

export const doctorVisitSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VisitSummaryInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; text?: string; error?: string }> => {
    const { supabase } = context;

    const reports = data.reportIds.length
      ? (
          await supabase
            .from("medical_reports")
            .select("title, created_at, summary, analysis")
            .in("id", data.reportIds)
        ).data
      : [];

    const assessments = data.assessmentIds.length
      ? (
          await supabase
            .from("assessments")
            .select("created_at, symptoms, summary, risk_level, duration, severity, recommendations")
            .in("id", data.assessmentIds)
        ).data
      : [];

    if (!data.symptoms.trim() && !reports?.length && !assessments?.length) {
      return { ok: false, error: "Add symptoms or select at least one report or assessment." };
    }

    try {
      const { callGateway } = await import("./report-ai.server");
      const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const text = await callGateway(MEDISAGE_SYSTEM_PROMPT, [
        {
          type: "text",
          text: `Create a concise one-page consultation summary the user can take to their doctor.
Use only the information given — never invent symptoms, history or values.

Symptoms described by the user: ${data.symptoms || "(none provided)"}
Saved assessments: ${JSON.stringify(assessments ?? [])}
Uploaded reports: ${JSON.stringify(reports ?? [])}

Write markdown with these sections:
## Main symptoms
## Duration and changes
## Relevant test results
## Values outside the reference range
## Timeline of reports
## Questions to ask my doctor
Keep it tight and factual. End with one short line noting this is an AI-assisted summary, not a diagnosis.`,
        },
      ]);
      return { ok: true, text };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "We couldn't complete the analysis." };
    }
  });
