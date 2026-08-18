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

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

async function callGateway(system: string, content: ContentBlock[]): Promise<string> {
  const { GATEWAY_URL, MEDISAGE_MODEL } = await import("./ai-gateway.server");
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI service is not configured.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MEDISAGE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("MediSage AI is busy right now. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace. Please add credits to continue.");
    console.error("gateway error", res.status, text);
    throw new Error("We couldn't complete the analysis.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const out = json.choices?.[0]?.message?.content;
  if (!out) throw new Error("We couldn't complete the analysis.");
  return out;
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("We couldn't complete the analysis.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const analyzeMedicalReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; analysis?: ReportAnalysis; error?: string }> => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("medical_reports")
      .select("id, file_path, file_type, kind, title")
      .eq("id", data.reportId)
      .maybeSingle();

    if (error || !row || !row.file_path) {
      return { ok: false, error: "We couldn't find that uploaded file." };
    }

    const download = await supabase.storage.from("medical-reports").download(row.file_path);
    if (download.error || !download.data) {
      return { ok: false, error: "We couldn't read the uploaded file. Please try uploading it again." };
    }

    const buffer = new Uint8Array(await download.data.arrayBuffer());
    if (buffer.byteLength < 2000) {
      return {
        ok: false,
        error: "The report could not be read reliably. Please upload a clearer image or PDF.",
      };
    }

    const mime = row.file_type || "application/pdf";
    const base64 = toBase64(buffer);
    const isPdf = mime.includes("pdf");
    const isImage = mime.startsWith("image/");
    const isMedicalImage = row.kind === "image";

    const instruction = isMedicalImage
      ? `The user uploaded a medical image for AI-assisted image review (not diagnosis).
First check image quality: readable, not too blurry, not too dark, not too small. If quality is insufficient, set readable=false and set unreadable_reason to "This image is not clear enough for reliable analysis. Please upload a clearer image."
Return ONLY JSON with this shape:
{"readable":true,"unreadable_reason":"","document_type":"image","title":"short label","lab_name":"","report_date":"","tests":[],"summary":"cautious plain-language summary","abnormal_findings":[],"interpretation":"","image_review":{"quality":"good|fair|poor","appears_to_be":"e.g. chest X-ray / unclear","observations":["cautious visible features only"],"caution":"AI image interpretation may be unreliable; a radiologist or doctor must interpret this image."},"questions_for_doctor":["..."],"next_step":"...","warning_signs":[]}`
      : `The user uploaded a laboratory / medical report. Extract every test you can actually read.
If the document cannot be read reliably, set readable=false and unreadable_reason to "The report could not be read reliably. Please upload a clearer image or PDF."
Return ONLY JSON with this shape:
{"readable":true,"unreadable_reason":"","document_type":"lab","title":"e.g. Complete Blood Count","lab_name":"laboratory name if printed","report_date":"YYYY-MM-DD if printed else empty","tests":[{"name":"Hemoglobin","result":"10.2","unit":"g/dL","reference_range":"13-17","reference_source":"report|general|none","status":"normal|borderline|high|low|unknown","explanation":"one or two plain sentences about this value"}],"summary":"3-4 plain sentences","abnormal_findings":["..."],"interpretation":"plain-language interpretation, cautious","questions_for_doctor":["5 useful questions"],"next_step":"...","warning_signs":["only if genuinely relevant"]}`;

    const content: ContentBlock[] = [{ type: "text", text: instruction }];
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
      const { REPORT_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const raw = await callGateway(REPORT_SYSTEM_PROMPT, content);
      analysis = reportAnalysisSchema.parse(parseJson(raw));
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
        "The report could not be read reliably. Please upload a clearer image or PDF.";
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
        analysis: analysis as unknown as Record<string, unknown>,
        summary: analysis.summary,
        abnormal_count: abnormal,
        lab_name: analysis.lab_name || null,
        report_date: reportDate,
        error_message: null,
        ...(analysis.title ? { title: analysis.title } : {}),
      })
      .eq("id", data.reportId);

    return { ok: true, analysis };
  });

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
          ? "Explain the medical meaning in more detail, still in accessible language."
          : "Use accurate medical terminology with a detailed interpretation, as written for a clinically literate reader.";

    try {
      const { MEDISAGE_SYSTEM_PROMPT } = await import("./ai-gateway.server");
      const text = await callGateway(MEDISAGE_SYSTEM_PROMPT, [
        {
          type: "text",
          text: `Explain this already-extracted report analysis. ${tone}
The underlying facts must stay identical — never add values, ranges or findings that are not in the data.
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
            .select("created_at, symptoms, summary, risk_level, result")
            .in("id", data.assessmentIds)
        ).data
      : [];

    if (!data.symptoms.trim() && !reports?.length && !assessments?.length) {
      return { ok: false, error: "Add symptoms or select at least one report or assessment." };
    }

    try {
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
